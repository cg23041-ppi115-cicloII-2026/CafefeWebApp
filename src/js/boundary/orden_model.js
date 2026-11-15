import OrdenDAO from "../control/orden_dao.js";
import OrdenProductoDAO from "../control/orden_producto_dao.js";
import ProductoDAO from "../control/producto_dao.js";
import "./components/cafefe_navbar.js";
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
        this._hayMasPaginas = false;

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

    _extraerCliente(orden, items = []) {
        const fuente = `${items[0]?.observaciones || ""} | ${orden?.observaciones || ""}`;
        const match = fuente.match(/\[CLIENTE:\s*([^\]]+)\]/i) || fuente.match(/Cliente:\s*([^|]+)/i);
        return match ? match[1].trim() : null;
    }

    _limpiarEtiquetasEstado(obs = "") {
        return String(obs || "")
            .replace(/\s*\|\s*\[ESTADO:[^\]]*\]/g, "")
            .replace(/^\[ESTADO:[^\]]*\]\s*\|\s*/g, "")
            .trim();
    }

    _limpiarEtiquetasInternas(obs = "") {
        return this._limpiarEtiquetasEstado(obs)
            .replace(/\[CLIENTE:\s*[^\]]+\]\s*\|\s*/gi, "")
            .replace(/\s*\|\s*\[CLIENTE:\s*[^\]]+\]/gi, "")
            .replace(/^\[CLIENTE:\s*[^\]]+\]$/gi, "")
            .trim();
    }

    _construirObservacion(obsActual, etiquetaEstado) {
        const base = this._limpiarEtiquetasEstado(obsActual);
        return base ? `${base} | ${etiquetaEstado}` : etiquetaEstado;
    }

    _normalizarProductos(itemsCrudos) {
        return itemsCrudos.map(item => {
            const esObjeto = typeof item.idProducto === "object" && item.idProducto !== null;
            const idProd = esObjeto ? item.idProducto.idProducto : item.idProducto;
            const nombre = (esObjeto && item.idProducto.nombre)
                || this._mapaProductos.get(String(idProd))
                || `Producto #${String(idProd).slice(-5).toUpperCase()}`;

            return {
                ...item,
                idProducto: idProd,
                nombreProducto: nombre,
                observacionesLimpias: this._limpiarEtiquetasInternas(item.observaciones),
                listo: false
            };
        });
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
                this._hayMasPaginas = datos.length === this._tamanoPagina;

                const promesas = datos.map(orden => {
                    const prodDAO = new OrdenProductoDAO(orden.idOrden);
                    return prodDAO.findRange(0, 50)
                        .then(r => {
                            const items = Array.isArray(r.datos) ? r.datos : [];
                            const clienteNombre = this._extraerCliente(orden, items);
                            const ordenConCliente = {
                                ...orden,
                                clienteNombre,
                                observaciones: clienteNombre
                                    ? `Cliente: ${clienteNombre}${orden.observaciones ? ` | ${this._limpiarEtiquetasInternas(orden.observaciones)}` : ""}`
                                    : orden.observaciones
                            };

                            if (items.length === 0) return { tipo: "pendiente", orden: ordenConCliente };

                            const obs = items[0].observaciones || "";
                            if (obs.includes("[ESTADO: ENTREGADO") || obs.includes("[ESTADO: CANCELADO")) {
                                return null;
                            }
                            if (obs.includes("[ESTADO: LISTO]")) {
                                return { tipo: "lista", orden: ordenConCliente, productos: this._normalizarProductos(items) };
                            }
                            if (obs.includes("[ESTADO: PREPARANDOSE]")) {
                                return { tipo: "proceso", orden: ordenConCliente, productos: this._normalizarProductos(items) };
                            }
                            return { tipo: "pendiente", orden: ordenConCliente };
                        })
                        .catch(() => {
                            const clienteNombre = this._extraerCliente(orden);
                            return { tipo: "pendiente", orden: { ...orden, clienteNombre } };
                        });
                });

                return Promise.all(promesas).then(resultados => {
                    const pendientes = [];
                    const listas = [];
                    let enProceso = null;

                    resultados.forEach(r => {
                        if (!r) return;
                        if (r.tipo === "lista") {
                            listas.push({ orden: r.orden, productos: r.productos });
                        } else if (r.tipo === "proceso" && !enProceso) {
                            enProceso = { orden: r.orden, productos: r.productos };
                        } else {
                            pendientes.push(r.orden);
                        }
                    });

                    this._pendientes = pendientes;
                    this._enProceso = enProceso;
                    this._listas = listas;
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

    _actualizarProductosBD(idOrden, productos, etiquetaEstado) {
        const prodDAO = new OrdenProductoDAO(idOrden);
        const promesas = productos.map(prod => {
            const nuevaObs = this._construirObservacion(prod.observaciones, etiquetaEstado);
            prod.observaciones = nuevaObs;
            return prodDAO.update(prod.idOrdenProducto, {
                idOrdenProducto: prod.idOrdenProducto,
                precio: Number(prod.precio || 0),
                observaciones: nuevaObs,
                idProducto: { idProducto: prod.idProducto }
            }).catch(err => console.warn(`Error update ${etiquetaEstado}:`, err));
        });
        return Promise.all(promesas);
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

                const clienteNombre = orden.clienteNombre || this._extraerCliente(orden, itemsCrudos);
                const ordenConCliente = { ...orden, clienteNombre };
                const productos = this._normalizarProductos(itemsCrudos);
                this._actualizarProductosBD(orden.idOrden, productos, "[ESTADO: PREPARANDOSE]");

                this._pendientes = this._pendientes.filter(o => o.idOrden !== orden.idOrden);
                this._enProceso = { orden: ordenConCliente, productos };
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
            this._actualizarProductosBD(o.idOrden, productos, "[ESTADO: DEVUELTO A COLA]");
        }
        this._pendientes.unshift(o);
        this._enProceso = null;
        this._renderizarListas();
    }

    _completarOrden(orden) {
        this._limpiarError();
        const { orden: o, productos } = this._enProceso || { orden, productos: [] };

        if (productos.length > 0) {
            this._actualizarProductosBD(o.idOrden, productos, "[ESTADO: LISTO]");
        }
        this._listas.unshift({ orden: o, productos });
        this._enProceso = null;
        this._renderizarListas();
    }

    _entregarOrden(orden) {
        this._limpiarError();
        const item = this._listas.find(it => it.orden.idOrden === orden.idOrden);

        if (item && item.productos.length > 0) {
            const hora = new Date().toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" });
            this._actualizarProductosBD(item.orden.idOrden, item.productos, `[ESTADO: ENTREGADO ${hora}]`);
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

        const etiqueta = `[ESTADO: CANCELADO - ${motivo}]`;

        if (productos.length > 0) {
            this._actualizarProductosBD(orden.idOrden, productos, etiqueta);
        } else {
            const prodDAO = new OrdenProductoDAO(orden.idOrden);
            prodDAO.findRange(0, 50).then(res => {
                const items = this._normalizarProductos(Array.isArray(res.datos) ? res.datos : []);
                if (items.length > 0) {
                    this._actualizarProductosBD(orden.idOrden, items, etiqueta);
                }
            }).catch(() => {});
        }

        this._renderizarListas();
    }

    _abrirHistorialTurno() {
        const modal = this._root.querySelector("modal-historial-orden");
        if (!modal) return;

        this._ordenDAO.findRange(0, 30)
            .then(res => {
                const lista = Array.isArray(res.datos) ? res.datos : [];
                const promesas = lista.map(orden => {
                    const pDAO = new OrdenProductoDAO(orden.idOrden);
                    return pDAO.findRange(0, 10).then(r => {
                        const items = Array.isArray(r.datos) ? r.datos : [];
                        const obs = items[0]?.observaciones || "";
                        const esEntregado = obs.includes("[ESTADO: ENTREGADO");
                        const esCancelado = obs.includes("[ESTADO: CANCELADO");
                        if (esEntregado || esCancelado) {
                            const clienteNombre = this._extraerCliente(orden, items);
                            return {
                                orden: { ...orden, clienteNombre },
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
                modal.abrir(itemsHistorial.filter(it => it !== null));
            })
            .catch(err => {
                this._mostrarError("Error al cargar el historial del turno", err);
            });
    }

    _reabrirOrden(itemHistorial) {
        const { orden, productos } = itemHistorial;
        const normalizados = this._normalizarProductos(productos);
        this._actualizarProductosBD(orden.idOrden, normalizados, "[ESTADO: REABIERTO]")
            .then(() => this._cargarOrdenes());
    }

    _dibujarLayout() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/orden_model.css">

            <cafefe-navbar titulo="Cafefe · Pantalla de Cocina y Barista">
                <button type="button" class="btn-outline" id="btnHistorial">Ver Historial del Turno</button>
                <button type="button" class="btn-secundario" id="btnRefrescar">Actualizar Cola</button>
            </cafefe-navbar>

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

        this._root.querySelector("#btnHistorial").addEventListener("click", () => this._abrirHistorialTurno());
        this._root.querySelector("#btnRefrescar").addEventListener("click", () => this._cargarOrdenes());

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
            if (this._hayMasPaginas) {
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
            paginador.configurar(this._pagina, this._hayMasPaginas);
        }
    }
}

customElements.define("orden-model", OrdenModel);
export default OrdenModel;