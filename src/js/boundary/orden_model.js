import OrdenDAO from "../control/orden_dao.js";
import OrdenProductoDAO from "../control/orden_producto_dao.js";
import ProductoDAO from "../control/producto_dao.js";
import "./components/orden/orden_header.js";
import "./components/orden/tarjeta_orden.js";
import "./components/orden/orden_proceso.js";
import "./components/orden/modal_cancelar_orden.js";
import "./components/orden/modal_historial_orden.js";
import "./components/orden/paginacion_ordenes.js";
import "./components/mensaje_error.js";

class OrdenModel extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._ordenDAO = new OrdenDAO();
        this._productoDAO = new ProductoDAO();
        this._mapaProductos = new Map();

        this._pagina = 0;
        this._tamanoPagina = 3;

        this._pendientes = [];
        this._enProceso = null; // { orden, productos }
        this._listas = []; // [{ orden, productos }]
    }

    connectedCallback() {
        this._dibujarLayout();
        this._cargarCatalogoProductos()
            .finally(() => this._cargarOrdenes());
    }

    _mostrarError(titulo, err, accionReintentar = null) {
        const zona = this._root.querySelector("#zonaErrores");
        zona.innerHTML = "";

        const alerta = document.createElement("mensaje-error");
        alerta.titulo = titulo;
        alerta.error = err;
        alerta.reintentable = typeof accionReintentar === "function";

        if (accionReintentar) {
            alerta.addEventListener("reintentar-operacion", () => {
                this._limpiarError();
                accionReintentar();
            });
        }

        zona.appendChild(alerta);
    }

    _limpiarError() {
        const zona = this._root.querySelector("#zonaErrores");
        if (zona) zona.innerHTML = "";
    }

    _cargarCatalogoProductos() {
        return this._productoDAO.findRange(0, 50)
            .then(res => {
                const lista = Array.isArray(res.datos) ? res.datos : [];
                this._mapaProductos.clear();
                lista.forEach(prod => {
                    this._mapaProductos.set(String(prod.idProducto), prod.nombre);
                });
            })
            .catch(err => {
                this._mostrarError(
                    "Advertencia: Catálogo de productos no disponible",
                    err,
                    () => this._cargarCatalogoProductos()
                );
            });
    }

    _cargarOrdenes() {
        const first = this._pagina * this._tamanoPagina;
        this._ordenDAO.findRange(first, this._tamanoPagina)
            .then(res => {
                this._limpiarError();
                const datos = Array.isArray(res.datos) ? res.datos : [];
                const idActivo = this._enProceso?.orden?.idOrden;
                const idsListos = new Set(this._listas.map(item => item.orden.idOrden));

                const candidatas = datos.filter(o => o.idOrden !== idActivo && !idsListos.has(o.idOrden));

                const promesas = candidatas.map(orden => {
                    const prodDAO = new OrdenProductoDAO(orden.idOrden);
                    return prodDAO.findRange(0, 1)
                        .then(r => {
                            const items = Array.isArray(r.datos) ? r.datos : [];
                            if (items.length === 0) return orden;
                            const obs = items[0].observaciones || "";
                            if (obs.includes("[ESTADO: ENTREGADO]") || obs.includes("Entregado") ||
                                obs.includes("[ESTADO: CANCELADO") || obs.includes("CANCELADO")) {
                                return null;
                            }
                            return { ...orden, observaciones: obs };
                        })
                        .catch(() => orden);
                });

                return Promise.all(promesas).then(resultados => {
                    this._pendientes = resultados.filter(o => o !== null);
                    this._renderizarListas();
                });
            })
            .catch(err => {
                this._mostrarError(
                    "No se pudo cargar la cola de órdenes",
                    err,
                    () => this._cargarOrdenes()
                );
            });
    }

    _tomarOrden(orden) {
        if (this._enProceso) {
            this._mostrarError(
                "Estación ocupada",
                "Ya tienes un pedido en preparación. Complétalo o devuélvelo a la cola antes de tomar otro."
            );
            return;
        }

        const prodDAO = new OrdenProductoDAO(orden.idOrden);
        prodDAO.findRange(0, 50)
            .then(res => {
                this._limpiarError();
                const itemsCrudos = Array.isArray(res.datos) ? res.datos : [];

                if (itemsCrudos.length === 0) {
                    this._mostrarError(
                        "Orden sin productos",
                        `La orden #${String(orden.idOrden).slice(-5).toUpperCase()} no tiene productos registrados.`
                    );
                    return;
                }

                const productos = itemsCrudos.map(item => {
                    const esObjeto = typeof item.idProducto === "object" && item.idProducto !== null;
                    const idProd = esObjeto ? item.idProducto.idProducto : item.idProducto;
                    const nombre = (esObjeto && item.idProducto.nombre)
                        || this._mapaProductos.get(String(idProd))
                        || `Producto #${String(idProd).slice(-5).toUpperCase()}`;

                    return {
                        ...item,
                        idProducto: idProd,
                        nombreProducto: nombre,
                        listo: false
                    };
                });

                // Sincronizar [ESTADO: PREPARANDOSE] en BD para todos los productos
                const actualizaciones = productos.map(prod => {
                    const nuevaObs = (prod.observaciones || "") + " | [ESTADO: PREPARANDOSE]";
                    prod.observaciones = nuevaObs;
                    return prodDAO.update(prod.idOrdenProducto, {
                        precio: Number(prod.precio || 0),
                        observaciones: nuevaObs,
                        idProducto: { idProducto: prod.idProducto }
                    }).catch(err => console.warn("Error update preparandose:", err));
                });
                Promise.all(actualizaciones);

                this._pendientes = this._pendientes.filter(o => o.idOrden !== orden.idOrden);
                this._enProceso = { orden, productos };
                this._renderizarListas();
            })
            .catch(err => {
                this._mostrarError(
                    "Error al obtener los productos del pedido",
                    err,
                    () => this._tomarOrden(orden)
                );
            });
    }

    _devolverOrden(orden) {
        this._limpiarError();
        const { orden: o, productos } = this._enProceso || { orden, productos: [] };

        if (productos.length > 0) {
            const prodDAO = new OrdenProductoDAO(o.idOrden);
            productos.forEach(prod => {
                const nuevaObs = (prod.observaciones || "") + " | [ESTADO: DEVUELTO A COLA]";
                prod.observaciones = nuevaObs;
                prodDAO.update(prod.idOrdenProducto, {
                    precio: Number(prod.precio || 0),
                    observaciones: nuevaObs,
                    idProducto: { idProducto: prod.idProducto }
                }).catch(err => console.warn("Error update devuelto:", err));
            });
        }
        this._pendientes.unshift(o);
        this._enProceso = null;
        this._renderizarListas();
    }

    _completarOrden(orden) {
        this._limpiarError();
        const { orden: o, productos } = this._enProceso || { orden, productos: [] };

        if (productos.length > 0) {
            const prodDAO = new OrdenProductoDAO(o.idOrden);
            productos.forEach(prod => {
                const nuevaObs = (prod.observaciones || "") + " | [ESTADO: LISTO]";
                prod.observaciones = nuevaObs;
                prodDAO.update(prod.idOrdenProducto, {
                    precio: Number(prod.precio || 0),
                    observaciones: nuevaObs,
                    idProducto: { idProducto: prod.idProducto }
                }).catch(err => console.warn("Error update listo:", err));
            });
        }
        this._listas.unshift({ orden: o, productos });
        this._enProceso = null;
        this._renderizarListas();
    }

    _entregarOrden(orden) {
        this._limpiarError();
        const item = this._listas.find(it => it.orden.idOrden === orden.idOrden);

        if (item && item.productos.length > 0) {
            const hora = new Date().toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" });
            const prodDAO = new OrdenProductoDAO(item.orden.idOrden);
            item.productos.forEach(prod => {
                const nuevaObs = (prod.observaciones || "") + ` | [ESTADO: ENTREGADO ${hora}]`;
                prod.observaciones = nuevaObs;
                prodDAO.update(prod.idOrdenProducto, {
                    precio: Number(prod.precio || 0),
                    observaciones: nuevaObs,
                    idProducto: { idProducto: prod.idProducto }
                }).catch(err => console.warn("Error update entregado:", err));
            });
        }
        this._listas = this._listas.filter(it => it.orden.idOrden !== orden.idOrden);
        this._renderizarListas();
    }

    _abrirModalCancelar(orden) {
        const modal = this._root.querySelector("modal-cancelar-orden");
        if (modal) modal.abrir(orden);
    }

    _cancelarOrdenConMotivo(orden, motivo) {
        this._limpiarError();
        if (!orden) return;

        let productos = [];
        if (this._enProceso && this._enProceso.orden.idOrden === orden.idOrden) {
            productos = this._enProceso.productos;
            this._enProceso = null;
        } else {
            const itemLista = this._listas.find(it => it.orden.idOrden === orden.idOrden);
            if (itemLista) {
                productos = itemLista.productos;
                this._listas = this._listas.filter(it => it.orden.idOrden !== orden.idOrden);
            }
        }
        this._pendientes = this._pendientes.filter(o => o.idOrden !== orden.idOrden);

        const textoEstado = `[ESTADO: CANCELADO - ${motivo}]`;

        if (productos.length > 0) {
            const prodDAO = new OrdenProductoDAO(orden.idOrden);
            productos.forEach(prod => {
                const nuevaObs = (prod.observaciones || "") + ` | ${textoEstado}`;
                prod.observaciones = nuevaObs;
                prodDAO.update(prod.idOrdenProducto, {
                    precio: Number(prod.precio || 0),
                    observaciones: nuevaObs,
                    idProducto: { idProducto: prod.idProducto }
                }).catch(err => console.warn("Error update cancelado:", err));
            });
        } else {
            const prodDAO = new OrdenProductoDAO(orden.idOrden);
            prodDAO.findRange(0, 50).then(res => {
                const items = Array.isArray(res.datos) ? res.datos : [];
                items.forEach(prod => {
                    const idProd = typeof prod.idProducto === "object" && prod.idProducto !== null 
                        ? prod.idProducto.idProducto 
                        : prod.idProducto;
                    const nuevaObs = (prod.observaciones || "") + ` | ${textoEstado}`;
                    prodDAO.update(prod.idOrdenProducto, {
                        precio: Number(prod.precio || 0),
                        observaciones: nuevaObs,
                        idProducto: { idProducto: idProd }
                    }).catch(err => console.warn("Error update cancelado:", err));
                });
            }).catch(() => {});
        }

        this._renderizarListas();
    }

    _abrirHistorialTurno() {
        const modal = this._root.querySelector("modal-historial-orden");
        if (!modal) return;

        // Cargar últimas 30 órdenes y filtrar las que tienen ENTREGADO o CANCELADO
        this._ordenDAO.findRange(0, 30)
            .then(res => {
                const lista = Array.isArray(res.datos) ? res.datos : [];
                const promesas = lista.map(orden => {
                    const pDAO = new OrdenProductoDAO(orden.idOrden);
                    return pDAO.findRange(0, 10).then(r => {
                        const items = Array.isArray(r.datos) ? r.datos : [];
                        const obs = items[0]?.observaciones || "";
                        const esEntregado = obs.includes("ENTREGADO") || obs.includes("Entregado");
                        const esCancelado = obs.includes("CANCELADO");
                        if (esEntregado || esCancelado) {
                            return {
                                orden,
                                productos: items,
                                estado: esCancelado ? "cancelado" : "entregado",
                                detalleEstado: obs
                            };
                        }
                        return null;
                    }).catch(() => null);
                });

                return Promise.all(promesas);
            })
            .then(itemsHistorial => {
                const itemsFiltrados = itemsHistorial.filter(it => it !== null);
                modal.abrir(itemsFiltrados);
            })
            .catch(() => {
                this._mostrarError("Error al cargar el historial del turno");
            });
    }

    _reabrirOrden(itemHistorial) {
        const { orden, productos } = itemHistorial;
        const prodDAO = new OrdenProductoDAO(orden.idOrden);

        const updates = productos.map(prod => {
            const idProd = typeof prod.idProducto === "object" && prod.idProducto !== null 
                ? prod.idProducto.idProducto 
                : prod.idProducto;
            let obsLimpia = (prod.observaciones || "")
                .replace(/ \| \[ESTADO: ENTREGADO[^\]]*\]/g, "")
                .replace(/ \| \[ESTADO: CANCELADO[^\]]*\]/g, "")
                .replace(/ \| 📦 Entregado[^\n|]*/g, "")
                .replace(/ \| ❌ CANCELADO/g, "");
            obsLimpia += " | [ESTADO: REABIERTO]";

            return prodDAO.update(prod.idOrdenProducto, {
                precio: Number(prod.precio || 0),
                observaciones: obsLimpia,
                idProducto: { idProducto: idProd }
            }).catch(() => {});
        });

        Promise.all(updates).then(() => {
            this._cargarOrdenes();
        });
    }

    _dibujarLayout() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/orden_model.css">

            <orden-header></orden-header>

            <div class="zona-errores" id="zonaErrores"></div>
            <modal-cancelar-orden></modal-cancelar-orden>
            <modal-historial-orden></modal-historial-orden>

            <main class="tablero">
                <div class="fila-superior">
                    <section class="columna">
                        <h2>Cola de Espera</h2>
                        <div class="lista-tarjetas" id="contenedorPendientes"></div>
                        <paginacion-ordenes id="paginador"></paginacion-ordenes>
                    </section>
                    <section class="columna">
                        <h2>En Preparación</h2>
                        <orden-proceso id="visorProceso"></orden-proceso>
                    </section>
                </div>
                <div class="fila-inferior">
                    <section class="columna">
                        <h2>Listos para Recoger</h2>
                        <div class="lista-tarjetas" id="contenedorListas"></div>
                    </section>
                </div>
            </main>
        `;

        this._root.addEventListener("abrir-historial", () => this._abrirHistorialTurno());
        this._root.addEventListener("refrescar-cola", () => this._cargarOrdenes());
        this._root.addEventListener("confirmar-cancelacion", e => {
            const { orden, motivo } = e.detail;
            this._cancelarOrdenConMotivo(orden, motivo);
        });
        this._root.addEventListener("reabrir-orden", e => this._reabrirOrden(e.detail));
        this._root.addEventListener("pagina-anterior", () => {
            if (this._pagina > 0) {
                this._pagina--;
                this._cargarOrdenes();
            }
        });
        this._root.addEventListener("pagina-siguiente", () => {
            if (this._pendientes.length === this._tamanoPagina) {
                this._pagina++;
                this._cargarOrdenes();
            }
        });

        this._root.addEventListener("tomar-orden", e => this._tomarOrden(e.detail));
        this._root.addEventListener("devolver-orden", e => this._devolverOrden(e.detail));
        this._root.addEventListener("orden-completada", e => this._completarOrden(e.detail));
        this._root.addEventListener("entregar-orden", e => this._entregarOrden(e.detail));
        this._root.addEventListener("cancelar-orden", e => this._abrirModalCancelar(e.detail));
    }

    _renderizarListas() {
        const contPendientes = this._root.querySelector("#contenedorPendientes");
        const contListas = this._root.querySelector("#contenedorListas");
        const visorProceso = this._root.querySelector("#visorProceso");

        contPendientes.innerHTML = "";
        if (this._pendientes.length === 0) {
            contPendientes.innerHTML = `<p class="texto-vacio">No hay pedidos pendientes en esta página.</p>`;
        } else {
            this._pendientes.forEach(orden => {
                const card = document.createElement("tarjeta-orden");
                card.modo = "pendiente";
                card.datos = orden;
                contPendientes.appendChild(card);
            });
        }

        visorProceso.ordenActual = this._enProceso || { orden: null, productos: [] };

        contListas.innerHTML = "";
        if (this._listas.length === 0) {
            contListas.innerHTML = `<p class="texto-vacio">Aún no hay pedidos listos para entregar.</p>`;
        } else {
            this._listas.forEach(item => {
                const card = document.createElement("tarjeta-orden");
                card.modo = "lista";
                card.datos = item.orden;
                contListas.appendChild(card);
            });
        }

        const paginador = this._root.querySelector("#paginador");
        if (paginador) {
            paginador.configurar(this._pagina, this._pendientes.length === this._tamanoPagina);
        }
    }
}

customElements.define("orden-model", OrdenModel);
export default OrdenModel;
