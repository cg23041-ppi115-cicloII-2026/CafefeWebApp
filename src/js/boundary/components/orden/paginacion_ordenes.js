class PaginacionOrdenes extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._pagina = 0;
        this._tieneSiguiente = false;
    }

    configurar(pagina, tieneSiguiente) {
        this._pagina = pagina;
        this._tieneSiguiente = tieneSiguiente;
        this._dibujar();
    }

    connectedCallback() {
        this._dibujar();
    }

    _dibujar() {
        this._root.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .paginacion {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 1rem;
                    margin-top: 1rem;
                    padding-top: 0.85rem;
                    border-top: 1px solid #dcd3cb;
                    font-family: var(--fuente-principal, system-ui, -apple-system, sans-serif);
                }

                button {
                    padding: 8px 16px;
                    border: 1px solid #6f4e37;
                    background-color: #ffffff;
                    color: #3e2723;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    transition: all 0.15s ease;
                }

                button:hover:not(:disabled) {
                    background-color: #6f4e37;
                    color: #ffffff;
                }

                button:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }

                .indicador-pagina {
                    font-weight: 700;
                    color: #3e2723;
                    font-size: 0.95rem;
                }
            </style>
            <div class="paginacion">
                <button type="button" id="btnAnterior" ${this._pagina === 0 ? "disabled" : ""}>← Anterior</button>
                <span class="indicador-pagina">Pág. ${this._pagina + 1}</span>
                <button type="button" id="btnSiguiente" ${!this._tieneSiguiente ? "disabled" : ""}>Siguiente →</button>
            </div>
        `;

        this._root.querySelector("#btnAnterior").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("pagina-anterior", {
                bubbles: true,
                composed: true
            }));
        });

        this._root.querySelector("#btnSiguiente").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("pagina-siguiente", {
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("paginacion-ordenes", PaginacionOrdenes);
export default PaginacionOrdenes;
