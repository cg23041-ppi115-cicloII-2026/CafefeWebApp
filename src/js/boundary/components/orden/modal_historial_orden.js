class ModalHistorialOrden extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._items = [];
    }

    abrir(items = []) {
        this._items = items;
        this._dibujar();
    }

    cerrar() {
        this._items = [];
        this._root.innerHTML = "";
    }

    _dibujar() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/modal_historial_orden.css">
            <div class="modal-overlay" id="overlayHistorial">
                <div class="modal-historial">
                    <div class="modal-historial-header">
                        <h3>Historial del Turno (Entregadas y Canceladas)</h3>
                        <button type="button" class="btn-cerrar-historial" id="btnCerrarHistorial">✕</button>
                    </div>
                    <div class="lista-historial" id="contenedorHistorial">
                        ${this._generarListaHTML()}
                    </div>
                </div>
            </div>
        `;

        this._root.querySelector("#btnCerrarHistorial").addEventListener("click", () => {
            this.cerrar();
        });

        this._root.querySelectorAll(".btn-reabrir").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = Number(e.target.dataset.index);
                const item = this._items[index];
                this.cerrar();
                this.dispatchEvent(new CustomEvent("reabrir-orden", {
                    detail: item,
                    bubbles: true,
                    composed: true
                }));
            });
        });
    }

    _generarListaHTML() {
        if (!this._items || this._items.length === 0) {
            return `<p class="sin-historial">No hay órdenes entregadas ni canceladas en este turno.</p>`;
        }

        return this._items.map((it, idx) => {
            const uidCorto = String(it.orden.idOrden || "0000").slice(-5).toUpperCase();
            const fechaStr = it.orden.fechaCreacion 
                ? new Date(it.orden.fechaCreacion).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }) 
                : "";
            const estadoTexto = it.estado === "cancelado" ? "Cancelada" : "Entregada";
            return `
                <div class="item-historial ${it.estado}">
                    <div class="item-historial-info">
                        <h4>Orden #${uidCorto} &nbsp;·&nbsp; ${estadoTexto} ${fechaStr ? `(${fechaStr})` : ""}</h4>
                        <p>${it.detalleEstado || "Sin detalles"}</p>
                    </div>
                    <button type="button" class="btn-reabrir" data-index="${idx}">
                        Reabrir Pedido
                    </button>
                </div>
            `;
        }).join("");
    }
}

customElements.define("modal-historial-orden", ModalHistorialOrden);
export default ModalHistorialOrden;