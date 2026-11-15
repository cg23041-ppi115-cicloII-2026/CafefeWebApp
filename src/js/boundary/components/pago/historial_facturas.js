import HistorialFacturasModel from "../../historial_facturas_model.js";
import "./tabla_facturas.js";

class HistorialFacturas extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._model = new HistorialFacturasModel();
        this._facturas = [];
        this._filtro = "";
        this._cargandoId = null;
    }

    connectedCallback() {
        this._dibujarEstructura();
        this._cargarFacturas();
    }

    async _cargarFacturas() {
        try {
            this._facturas = await this._model.obtenerFacturasOrdenadas();
        } catch {
            this._facturas = [];
        }
        this._actualizarTabla();
    }

    _filtrarFacturas() {
        const q = this._filtro.trim().toLowerCase();
        if (!q) return this._facturas;

        return this._facturas.filter(f => {
            const num = f.numeroFormateado.toLowerCase();
            const cli = String(f.cliente || "").toLowerCase();
            const obs = String(f.observaciones || "").toLowerCase();
            const fecha = f.fechaFormateada.toLowerCase();
            return num.includes(q) || cli.includes(q) || obs.includes(q) || fecha.includes(q);
        });
    }

    _actualizarTabla() {
        const tabla = this._root.querySelector("tabla-facturas");
        if (tabla) {
            tabla.datos = {
                facturas: this._filtrarFacturas(),
                cargandoId: this._cargandoId
            };
        }
    }

    async _reimprimirFactura(factura) {
        this._cargandoId = factura.idFactura;
        this._actualizarTabla();

        try {
            const detalleTicket = await this._model.construirDetalleTicket(factura);
            this.dispatchEvent(new CustomEvent("abrir-ticket-historico", {
                detail: detalleTicket,
                bubbles: true,
                composed: true
            }));
        } finally {
            this._cargandoId = null;
            this._actualizarTabla();
        }
    }

    _dibujarEstructura() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/historial_facturas.css">
            <div class="panel-historial">
                <div class="barra-busqueda">
                    <h2>Historial de Facturas Emitidas</h2>
                    <div class="controles-busqueda">
                        <input type="search" id="inputBuscarFactura" value="${this._filtro}"
                            placeholder="Buscar por # factura, orden, cliente o fecha...">
                        <button type="button" class="btn-refrescar" id="btnRecargarHistorial">↻</button>
                    </div>
                </div>
                <tabla-facturas></tabla-facturas>
            </div>
        `;

        this._root.querySelector("#inputBuscarFactura").addEventListener("input", (e) => {
            this._filtro = e.target.value;
            this._actualizarTabla();
        });

        this._root.querySelector("#btnRecargarHistorial").addEventListener("click", () => {
            this._cargarFacturas();
        });

        this._root.addEventListener("seleccionar-factura", (e) => {
            this._reimprimirFactura(e.detail);
        });

        this._actualizarTabla();
    }
}

customElements.define("historial-facturas", HistorialFacturas);
export default HistorialFacturas;