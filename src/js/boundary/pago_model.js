import OrdenDAO from "../control/orden_dao.js";
import OrdenProductoDAO from "../control/orden_producto_dao.js";
import ProductoDAO from "../control/producto_dao.js";
import CajaDAO from "../control/caja_dao.js";
import FacturaDAO from "../control/factura_dao.js";
import FacturaOrdenProductoDAO from "../control/factura_orden_producto_dao.js";
import PagoDAO from "../control/pago_dao.js";
import PagoDetalleDAO from "../control/pago_detalle_dao.js";

import "./components/cafefe_navbar.js";
import "./components/orden/tarjeta_horizontal.js";
import "./components/orden/paginacion_ordenes.js";
import "./components/pago/panel_cobro.js";
import "./components/pago/modal_ticket_pdf.js";
import "./components/pago/historial_facturas.js";
import "./components/mensaje_error.js";

class PagoModel extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._ordenDAO = new OrdenDAO();
        this._productoDAO = new ProductoDAO();
        this._cajaDAO = new CajaDAO();
        this._facturaDAO = new FacturaDAO();
        this._pagoDAO = new PagoDAO();

        this._mapaProductos = new Map();
        this._cajaActiva = null;

        this._pagina = 0;
        this._tamanoPagina = 10;
        this._hayMasPaginas = false;

        this._ordenesPorCobrar = []; // [{ orden, productos, total, cliente }]
        this._ordenSeleccionada = null;
        this._subvista = "cobro"; // "cobro" | "historial"
        this._listenersRegistrados = false;
    }

    connectedCallback() {
        if (!this._listenersRegistrados) {
            this._root.addEventListener("procesar-pago", e => this._procesarTransaccion(e.detail));
            this._root.addEventListener("abrir-ticket-historico", e => {
                const modalTicket = this._root.querySelector("modal-ticket-pdf");
                if (modalTicket) modalTicket.abrir(e.detail);
            });
            this._listenersRegistrados = true;
        }

        this._dibujarLayout();
        Promise.all([
            this._cargarCatalogoProductos(),
            this._cargarCajaActiva()
        ]).finally(() => this._cargarOrdenesPorCobrar());
    }

    _mostrarError(titulo, err, accionReintentar = null) {
        const zona = this._root.querySelector("#zonaErrores");
        if (!zona) return;
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
        return match ? match[1].trim() : "Consumidor Final";
    }

    _cargarCajaActiva() {
        return this._cajaDAO.findRange(0, 10)
            .then(res => {
                const cajas = Array.isArray(res.datos) ? res.datos : [];
                this._cajaActiva = cajas.find(c => c.activa !== false) || cajas[0] || null;
            })
            .catch(err => {
                this._mostrarError("No se pudo obtener la caja activa", err);
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
            .catch(() => {});
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
                nombreProducto: nombre
            };
        });
    }

    async _cargarOrdenesPorCobrar() {
        const first = this._pagina * this._tamanoPagina;
        try {
            const res = await this._ordenDAO.findRange(first, this._tamanoPagina);
            this._limpiarError();
            const datos = Array.isArray(res.datos) ? res.datos : [];
            this._hayMasPaginas = datos.length === this._tamanoPagina;

            const evaluadas = await Promise.all(datos.map(async orden => {
                try {
                    const pDAO = new OrdenProductoDAO(orden.idOrden);
                    const rProd = await pDAO.findRange(0, 50);
                    const itemsCrudos = Array.isArray(rProd.datos) ? rProd.datos : [];
                    if (itemsCrudos.length === 0) return null;

                    const obs = itemsCrudos[0].observaciones || "";
                    if (obs.includes("[ESTADO: PAGADO]") || obs.includes("[ESTADO: CANCELADO")) {
                        return null;
                    }

                    const productos = this._normalizarProductos(itemsCrudos);
                    const total = productos.reduce((acc, p) => acc + Number(p.precio || 0), 0);
                    const cliente = this._extraerCliente(orden, itemsCrudos);
                    return {
                        orden: { ...orden, clienteNombre: cliente },
                        productos,
                        total,
                        cliente
                    };
                } catch {
                    return null;
                }
            }));

            this._ordenesPorCobrar = evaluadas.filter(Boolean);
            if (this._subvista === "cobro") {
                this._renderizar();
            }
        } catch (err) {
            this._mostrarError(
                "Error al cargar las órdenes pendientes de pago",
                err,
                () => this._cargarOrdenesPorCobrar()
            );
        }
    }

    async _procesarTransaccion(detallePago) {
        const { orden, productos, abonos, totalPedido, totalPagado, vuelto } = detallePago;
        const panel = this._root.querySelector("#visorCobro");

        if (!this._cajaActiva?.idCaja) {
            this._mostrarError("Caja no configurada", "No existe una caja activa en la base de datos para emitir la factura.");
            return;
        }

        const idEmpleadoRol = typeof orden.idEmpleadoRol === "object"
            ? orden.idEmpleadoRol?.idEmpleadoRol
            : orden.idEmpleadoRol;

        if (!idEmpleadoRol) {
            this._mostrarError("Orden sin empleado asignado", "La orden no tiene un idEmpleadoRol válido para facturar.");
            return;
        }

        const clienteFactura = (
            detallePago.cliente ||
            orden?.clienteNombre ||
            this._extraerCliente(orden, productos) ||
            "Consumidor Final"
        ).trim();

        if (panel) panel.procesando = true;
        this._limpiarError();

        try {
            // 1. Crear Factura (POST /factura)
            const resFactura = await this._facturaDAO.create({
                idCaja: { idCaja: this._cajaActiva.idCaja },
                idEmpleadoRol: { idEmpleadoRol },
                cliente: clienteFactura,
                fechaFacturacion: new Date().toISOString(),
                estado: "PAGADA",
                observaciones: `Orden #${String(orden.idOrden).slice(-5).toUpperCase()} | Cliente: ${clienteFactura}`
            });
            const idFactura = resFactura.datos?.id;
            if (!idFactura) throw new Error("El servidor no devolvió el ID de la factura creada.");

            // 2. Vincular OrdenProductos a la Factura (POST /factura/{id}/ordenproducto)
            const fopDAO = new FacturaOrdenProductoDAO(idFactura);
            await Promise.all(productos.map(prod =>
                fopDAO.create({
                    idOrdenProducto: { idOrdenProducto: prod.idOrdenProducto }
                })
            ));

            // 3. Crear Pago maestro (POST /pago)
            const resPago = await this._pagoDAO.create({
                idFactura: { idFactura },
                estado: "COMPLETADO",
                observaciones: `Total: $${totalPedido.toFixed(2)} | Vuelto: $${vuelto.toFixed(2)}`
            });
            const idPago = resPago.datos?.id;
            if (!idPago) throw new Error("El servidor no devolvió el ID del pago registrado.");

            // 4. Registrar cada pago fraccionado (POST /pago/{idPago}/detalle)
            const pdDAO = new PagoDetalleDAO(idPago);
            await Promise.all(abonos.map(ab =>
                pdDAO.create({
                    monto: Number(ab.monto),
                    tipoPago: ab.tipoPago,
                    observaciones: `Pago ${ab.tipoPago}`,
                    referenciaExterna: ab.referenciaExterna || null
                })
            ));

            // 5. Marcar productos de la orden como [ESTADO: PAGADO]
            const opDAO = new OrdenProductoDAO(orden.idOrden);
            await Promise.all(productos.map(prod => {
                const baseObs = String(prod.observaciones || "")
                    .replace(/\s*\|\s*\[ESTADO:[^\]]*\]/g, "")
                    .trim();
                const nuevaObs = baseObs ? `${baseObs} | [ESTADO: PAGADO]` : "[ESTADO: PAGADO]";
                return opDAO.update(prod.idOrdenProducto, {
                    idOrdenProducto: prod.idOrdenProducto,
                    precio: Number(prod.precio || 0),
                    observaciones: nuevaObs,
                    idProducto: { idProducto: prod.idProducto }
                });
            }));

            // 6. Mostrar Ticket PDF y actualizar cola
            const modalTicket = this._root.querySelector("modal-ticket-pdf");
            if (modalTicket) {
                modalTicket.abrir({
                    idFactura,
                    cliente: clienteFactura,
                    orden: { ...orden, clienteNombre: clienteFactura },
                    productos,
                    abonos,
                    totalPedido,
                    totalPagado,
                    vuelto,
                    fecha: new Date().toLocaleString("es-SV")
                });
            }

            this._ordenSeleccionada = null;
            if (panel) panel.pedidoActual = null;
            await this._cargarOrdenesPorCobrar();
        } catch (err) {
            if (panel) panel.procesando = false;
            this._mostrarError("Error al registrar el pago en el sistema", err);
        }
    }

    _dibujarLayout() {
        const esCobro = this._subvista === "cobro";

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/pago_model.css">

            <cafefe-navbar titulo="Cafefe · Caja y Facturación (TPV)">
                <button type="button" class="${esCobro ? "btn-secundario" : "btn-outline"}" id="tabCobro">
                    Terminal de Cobro (TPV)
                </button>
                <button type="button" class="${!esCobro ? "btn-secundario" : "btn-outline"}" id="tabHistorial">
                    Historial de Facturas / Reimprimir
                </button>
            </cafefe-navbar>

            <div class="zona-errores" id="zonaErrores"></div>
            <modal-ticket-pdf></modal-ticket-pdf>

            ${esCobro ? `
                <main class="layout-tpv">
                    <section class="columna-ordenes">
                        <div class="cabecera-columna">
                            <h2>Órdenes Pendientes</h2>
                            <button type="button" class="btn-refrescar-mini" id="btnRefrescar">↻ Actualizar</button>
                        </div>
                        <div class="lista-ordenes" id="contenedorOrdenes"></div>
                        <paginacion-ordenes id="paginador"></paginacion-ordenes>
                    </section>

                    <section class="columna-cobro">
                        <panel-cobro id="visorCobro"></panel-cobro>
                    </section>
                </main>
            ` : `
                <historial-facturas id="vistaHistorial"></historial-facturas>
            `}
        `;

        this._root.querySelector("#tabCobro").addEventListener("click", () => {
            this._subvista = "cobro";
            this._dibujarLayout();
            this._renderizar();
        });

        this._root.querySelector("#tabHistorial").addEventListener("click", () => {
            this._subvista = "historial";
            this._dibujarLayout();
        });

        if (esCobro) {
            this._root.querySelector("#btnRefrescar").addEventListener("click", () => this._cargarOrdenesPorCobrar());

            this._root.querySelector("#paginador").addEventListener("pagina-anterior", () => {
                if (this._pagina > 0) {
                    this._pagina--;
                    this._cargarOrdenesPorCobrar();
                }
            });
            this._root.querySelector("#paginador").addEventListener("pagina-siguiente", () => {
                if (this._hayMasPaginas) {
                    this._pagina++;
                    this._cargarOrdenesPorCobrar();
                }
            });
        }
    }

    _renderizar() {
        const cont = this._root.querySelector("#contenedorOrdenes");
        if (!cont) return;
        cont.innerHTML = "";

        if (this._ordenesPorCobrar.length === 0) {
            cont.innerHTML = `<p class="texto-vacio">No hay órdenes pendientes de cobro en esta página.</p>`;
        } else {
            this._ordenesPorCobrar.forEach(item => {
                const uidCorto = String(item.orden.idOrden || "0000").slice(-5).toUpperCase();
                const seleccionada = this._ordenSeleccionada?.orden?.idOrden === item.orden.idOrden;

                const card = document.createElement("div");
                card.className = `tarjeta-cobro ${seleccionada ? "activa" : ""}`;
                card.innerHTML = `
                    <div class="tarjeta-cobro-info">
                        <span class="uid">#${uidCorto}</span>
                        <span class="monto">$${item.total.toFixed(2)}</span>
                    </div>
                    <div class="tarjeta-cobro-detalle">
                        <strong>${item.cliente}</strong> · ${item.productos.length} producto(s)
                    </div>
                    <button type="button" class="btn-seleccionar">
                        ${seleccionada ? "Seleccionada ✓" : "Seleccionar"}
                    </button>
                `;

                card.querySelector(".btn-seleccionar").addEventListener("click", () => {
                    this._ordenSeleccionada = item;
                    this._root.querySelector("#visorCobro").pedidoActual = item;
                    this._renderizar();
                });

                cont.appendChild(card);
            });
        }

        const paginador = this._root.querySelector("#paginador");
        if (paginador) paginador.configurar(this._pagina, this._hayMasPaginas);

        if (this._ordenSeleccionada) {
            const visor = this._root.querySelector("#visorCobro");
            if (visor) visor.pedidoActual = this._ordenSeleccionada;
        }
    }
}

customElements.define("pago-model", PagoModel);
export default PagoModel;