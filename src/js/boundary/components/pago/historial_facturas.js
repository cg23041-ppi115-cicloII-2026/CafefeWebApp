import FacturaDAO from "../../../control/factura_dao.js";
import FacturaOrdenProductoDAO from "../../../control/factura_orden_producto_dao.js";
import OrdenDAO from "../../../control/orden_dao.js";
import OrdenProductoDAO from "../../../control/orden_producto_dao.js";
import PagoDAO from "../../../control/pago_dao.js";
import PagoDetalleDAO from "../../../control/pago_detalle_dao.js";
import ProductoDAO from "../../../control/producto_dao.js";

class HistorialFacturas extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._facturaDAO = new FacturaDAO();
        this._ordenDAO = new OrdenDAO();
        this._pagoDAO = new PagoDAO();
        this._productoDAO = new ProductoDAO();

        this._facturas = [];
        this._filtro = "";
        this._mapaProductos = new Map();
        this._cargandoId = null;
    }

    connectedCallback() {
        this._dibujar();
        this._cargarProductos().finally(() => this._cargarFacturas());
    }

    _formatearFecha(fechaRaw) {
        if (!fechaRaw) return "Sin fecha";
        // Limpiar sufijos de zona horaria Java tipo [America/El_Salvador]
        const limpia = String(fechaRaw).replace(/\[.*\]$/, "").trim();
        const fechaObj = new Date(limpia);
        if (Number.isNaN(fechaObj.getTime())) {
            return limpia;
        }
        return fechaObj.toLocaleString("es-SV");
    }

    _cargarProductos() {
        return this._productoDAO.findRange(0, 100)
            .then(res => {
                const lista = Array.isArray(res.datos) ? res.datos : [];
                this._mapaProductos.clear();
                lista.forEach(p => this._mapaProductos.set(String(p.idProducto), p.nombre));
            })
            .catch(() => {});
    }

    async _cargarFacturas() {
        try {
            const res = await this._facturaDAO.findRange(0, 50);
            const lista = Array.isArray(res.datos) ? res.datos : [];
            this._facturas = lista.sort((a, b) => {
                const fa = new Date(String(a.fechaFacturacion || 0).replace(/\[.*\]$/, ""));
                const fb = new Date(String(b.fechaFacturacion || 0).replace(/\[.*\]$/, ""));
                return (fb.getTime() || 0) - (fa.getTime() || 0);
            });
            this._dibujar();
        } catch {
            this._facturas = [];
            this._dibujar();
        }
    }

    async _obtenerProductosDeFactura(factura) {
        // Intento 1: Subrecurso /factura/{id}/ordenproducto
        try {
            const fopDAO = new FacturaOrdenProductoDAO(factura.idFactura);
            const resFop = await fopDAO.findRange(0, 50);
            const itemsFop = Array.isArray(resFop.datos) ? resFop.datos : [];

            if (itemsFop.length > 0 && typeof itemsFop[0].idOrdenProducto === "object" && itemsFop[0].idOrdenProducto?.precio !== undefined) {
                return itemsFop.map(rel => {
                    const op = rel.idOrdenProducto;
                    const idProd = typeof op.idProducto === "object" ? op.idProducto?.idProducto : op.idProducto;
                    const nombre = (typeof op.idProducto === "object" && op.idProducto?.nombre)
                        || this._mapaProductos.get(String(idProd))
                        || `Producto #${String(idProd || "0000").slice(-5).toUpperCase()}`;
                    return {
                        nombreProducto: nombre,
                        precio: Number(op.precio || 0)
                    };
                });
            }
        } catch {
            // Continuar al respaldo por referencia de orden
        }

        // Intento 2 (Respaldo): Buscar la orden por el sufijo en observaciones ("Orden #XXXXX")
        try {
            const match = String(factura.observaciones || "").match(/#([A-Za-z0-9]+)/);
            if (match) {
                const sufijo = match[1].toUpperCase();
                const resOrdenes = await this._ordenDAO.findRange(0, 100);
                const ordenes = Array.isArray(resOrdenes.datos) ? resOrdenes.datos : [];
                const ordenEncontrada = ordenes.find(o =>
                    String(o.idOrden || "").toUpperCase().endsWith(sufijo)
                );

                if (ordenEncontrada) {
                    const opDAO = new OrdenProductoDAO(ordenEncontrada.idOrden);
                    const resOp = await opDAO.findRange(0, 50);
                    const itemsOp = Array.isArray(resOp.datos) ? resOp.datos : [];
                    return itemsOp.map(op => {
                        const idProd = typeof op.idProducto === "object" ? op.idProducto?.idProducto : op.idProducto;
                        const nombre = (typeof op.idProducto === "object" && op.idProducto?.nombre)
                            || this._mapaProductos.get(String(idProd))
                            || `Producto #${String(idProd || "0000").slice(-5).toUpperCase()}`;
                        return {
                            nombreProducto: nombre,
                            precio: Number(op.precio || 0)
                        };
                    });
                }
            }
        } catch {
            // Ignorar si no se encuentra
        }

        return [];
    }

    async _reimprimirFactura(factura) {
        this._cargandoId = factura.idFactura;
        this._dibujar();

        try {
            const productos = await this._obtenerProductosDeFactura(factura);
            const totalPedido = productos.reduce((acc, p) => acc + Number(p.precio || 0), 0);

            let abonos = [];
            try {
                const resPagos = await this._pagoDAO.findRange(0, 100);
                const pagos = Array.isArray(resPagos.datos) ? resPagos.datos : [];
                const pagoFactura = pagos.find(p => {
                    const idF = typeof p.idFactura === "object" ? p.idFactura?.idFactura : p.idFactura;
                    return String(idF) === String(factura.idFactura);
                });

                if (pagoFactura?.idPago) {
                    const pdDAO = new PagoDetalleDAO(pagoFactura.idPago);
                    const resDet = await pdDAO.findRange(0, 50);
                    const detalles = Array.isArray(resDet.datos) ? resDet.datos : [];
                    abonos = detalles.map(d => ({
                        tipoPago: d.tipoPago || "PAGO",
                        monto: Number(d.monto || 0),
                        referenciaExterna: d.referenciaExterna || ""
                    }));
                }
            } catch {
                // Respaldo si no hay detalles
            }

            if (abonos.length === 0) {
                abonos = [{ tipoPago: "PAGADO", monto: totalPedido, referenciaExterna: "" }];
            }

            const totalPagado = abonos.reduce((acc, a) => acc + a.monto, 0);
            const vuelto = totalPagado > totalPedido ? Number((totalPagado - totalPedido).toFixed(2)) : 0;

            this.dispatchEvent(new CustomEvent("abrir-ticket-historico", {
                detail: {
                    idFactura: factura.idFactura,
                    orden: null,
                    productos: productos.length > 0
                        ? productos
                        : [{ nombreProducto: factura.observaciones || "Consumo Cafefe", precio: totalPedido }],
                    abonos,
                    totalPedido,
                    totalPagado,
                    vuelto,
                    fecha: this._formatearFecha(factura.fechaFacturacion)
                },
                bubbles: true,
                composed: true
            }));
        } finally {
            this._cargandoId = null;
            this._dibujar();
        }
    }

    _dibujar() {
        const q = this._filtro.trim().toLowerCase();
        const filtradas = this._facturas.filter(f => {
            if (!q) return true;
            const num = String(f.idFactura || "").slice(-6).toLowerCase();
            const cli = String(f.cliente || "").toLowerCase();
            const obs = String(f.observaciones || "").toLowerCase();
            const fecha = this._formatearFecha(f.fechaFacturacion).toLowerCase();
            return num.includes(q) || cli.includes(q) || obs.includes(q) || fecha.includes(q);
        });

        const filasHTML = filtradas.length === 0
            ? `<tr><td colspan="5" class="vacio">No se encontraron facturas registradas.</td></tr>`
            : filtradas.map(f => {
                const num = String(f.idFactura || "00000").slice(-6).toUpperCase();
                const fecha = this._formatearFecha(f.fechaFacturacion);
                const cargando = this._cargandoId === f.idFactura;

                return `
                    <tr>
                        <td><strong>#F-${num}</strong></td>
                        <td>${fecha}</td>
                        <td>${f.cliente || "Consumidor Final"}</td>
                        <td>${f.observaciones || "-"}</td>
                        <td class="der">
                            <button type="button" class="btn-ver-ticket" data-id="${f.idFactura}" ${cargando ? "disabled" : ""}>
                                ${cargando ? "Cargando..." : "Ver / Guardar PDF"}
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");

        this._root.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: var(--fuente-principal);
                    color: var(--texto-principal);
                }
                .panel-historial {
                    max-width: 1280px;
                    margin: 0 auto;
                    background: var(--bg-tarjeta);
                    border-radius: var(--radio-panel);
                    border: 1px solid var(--borde-suave);
                    box-shadow: var(--sombra-suave);
                    padding: 1.5rem;
                }
                .barra-busqueda {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                    flex-wrap: wrap;
                    margin-bottom: 1.25rem;
                }
                .barra-busqueda h2 {
                    margin: 0;
                    font-size: 1.2rem;
                }
                .controles-busqueda {
                    display: flex;
                    gap: 8px;
                    flex: 1;
                    max-width: 460px;
                }
                input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1.5px solid var(--borde-suave);
                    border-radius: 8px;
                    font-family: inherit;
                    font-size: 0.9rem;
                }
                .btn-refrescar {
                    background: var(--bg-app);
                    color: var(--texto-principal);
                    border: 1px solid var(--borde-suave);
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-weight: 700;
                    cursor: pointer;
                }
                .tabla-wrap {
                    overflow-x: auto;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.92rem;
                }
                th {
                    background: var(--bg-contenedor);
                    text-align: left;
                    padding: 0.75rem 1rem;
                    border-bottom: 2px solid var(--borde-suave);
                    font-weight: 800;
                }
                td {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid var(--borde-suave);
                }
                .der { text-align: right; }
                .vacio {
                    text-align: center;
                    color: var(--texto-secundario);
                    padding: 2rem;
                }
                .btn-ver-ticket {
                    background: var(--color-primario);
                    color: var(--texto-claro);
                    border: none;
                    border-radius: 6px;
                    padding: 6px 12px;
                    font-weight: 700;
                    cursor: pointer;
                }
                .btn-ver-ticket:hover:not(:disabled) {
                    background: var(--color-primario-hover);
                }
                .btn-ver-ticket:disabled {
                    opacity: 0.5;
                    cursor: wait;
                }
            </style>

            <div class="panel-historial">
                <div class="barra-busqueda">
                    <h2>Historial de Facturas Emitidas</h2>
                    <div class="controles-busqueda">
                        <input type="search" id="inputBuscarFactura" value="${this._filtro}"
                            placeholder="Buscar por # factura, orden, cliente o fecha...">
                        <button type="button" class="btn-refrescar" id="btnRecargarHistorial">↻</button>
                    </div>
                </div>

                <div class="tabla-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>N° Factura</th>
                                <th>Fecha y Hora</th>
                                <th>Cliente</th>
                                <th>Referencia</th>
                                <th class="der">Comprobante</th>
                            </tr>
                        </thead>
                        <tbody>${filasHTML}</tbody>
                    </table>
                </div>
            </div>
        `;

        const inputBuscar = this._root.querySelector("#inputBuscarFactura");
        inputBuscar.addEventListener("input", (e) => {
            this._filtro = e.target.value;
            const pos = e.target.selectionStart;
            this._dibujar();
            const nuevoInput = this._root.querySelector("#inputBuscarFactura");
            nuevoInput.focus();
            nuevoInput.setSelectionRange(pos, pos);
        });

        this._root.querySelector("#btnRecargarHistorial").addEventListener("click", () => {
            this._cargarFacturas();
        });

        this._root.querySelectorAll(".btn-ver-ticket").forEach(btn => {
            btn.addEventListener("click", () => {
                const fact = this._facturas.find(f => String(f.idFactura) === String(btn.dataset.id));
                if (fact) this._reimprimirFactura(fact);
            });
        });
    }
}

customElements.define("historial-facturas", HistorialFacturas);
export default HistorialFacturas;