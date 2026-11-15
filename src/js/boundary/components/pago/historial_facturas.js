import "./tabla_facturas.js";

class HistorialFacturas extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._facturas = [];
        this._filtro = "";
        this._cargandoId = null;
        this._inicializado = false;
    }

    set facturas(lista) {
        this._facturas = Array.isArray(lista) ? lista : [];
        this._actualizarTabla();
    }

    set cargandoId(id) {
        this._cargandoId = id;
        this._actualizarTabla();
    }

    connectedCallback() {
        if (!this._inicializado) {
            this._dibujarEstructura();
            this._inicializado = true;
        }
        this._actualizarTabla();
    }

    _filtrarFacturas() {
        const q = this._filtro.trim().toLowerCase();
        if (!q) return this._facturas;

        return this._facturas.filter(f => {
            const num = String(f.numeroFormateado || "").toLowerCase();
            const cli = String(f.cliente || "").toLowerCase();
            const obs = String(f.observaciones || "").toLowerCase();
            const fecha = String(f.fechaFormateada || "").toLowerCase();
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

    _dibujarEstructura() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/historial_facturas.css">
            <div class="panel-historial">
                <div class="barra-busqueda">
                    <h2>Historial de Facturas Emitidas</h2>
                    <div class="controles-busqueda">
                        <input type="search" id="inputBuscarFactura"
                            placeholder="Buscar por # factura, orden, cliente o fecha...">
                        <button type="button" class="btn-refrescar" id="btnRecargarHistorial" title="Actualizar historial">↻</button>
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
            this.dispatchEvent(new CustomEvent("recargar-historial", {
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("historial-facturas", HistorialFacturas);
export default HistorialFacturas;