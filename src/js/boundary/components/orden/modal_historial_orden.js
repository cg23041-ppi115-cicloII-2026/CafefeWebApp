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
            <style>
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(40, 25, 15, 0.65);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(2px);
                    animation: fadeIn 0.2s ease;
                    font-family: var(--fuente-principal, system-ui, -apple-system, sans-serif);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .modal-historial {
                    background: #ffffff;
                    border-radius: 14px;
                    padding: 1.5rem;
                    width: 90%;
                    max-width: 800px;
                    max-height: 85vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.3);
                }

                .modal-historial-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 2px solid #e5ded4;
                    padding-bottom: 0.75rem;
                    margin-bottom: 1rem;
                }

                .modal-historial-header h3 {
                    margin: 0;
                    color: var(--coffee-brown, #4B3621);
                }

                .btn-cerrar-historial {
                    background: transparent;
                    border: none;
                    font-size: 1.4rem;
                    cursor: pointer;
                    color: #8c735d;
                    font-weight: 800;
                }

                .lista-historial {
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding-right: 0.5rem;
                }

                .item-historial {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.85rem 1.1rem;
                    border-radius: 8px;
                    background-color: #faf6f0;
                    border: 1px solid #e8decb;
                }

                .item-historial.entregado {
                    border-left: 5px solid #28a745;
                }

                .item-historial.cancelado {
                    border-left: 5px solid #dc3545;
                }

                .item-historial-info h4 {
                    margin: 0 0 0.25rem 0;
                    color: var(--coffee-brown, #4B3621);
                    font-size: 0.95rem;
                }

                .item-historial-info p {
                    margin: 0;
                    font-size: 0.8rem;
                    color: #6e5740;
                }

                .btn-reabrir {
                    background-color: transparent;
                    border: 1.5px solid var(--coffee-brown, #4B3621);
                    color: var(--coffee-brown, #4B3621);
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-weight: 700;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .btn-reabrir:hover {
                    background-color: var(--coffee-brown, #4B3621);
                    color: #ffffff;
                }
            </style>
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
            return `<p style="text-align: center; color: #6e5740; padding: 2rem 0;">No hay órdenes entregadas ni canceladas en este turno.</p>`;
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
