class BarraBusqueda extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._valor = "";
        this._inicializado = false;
    }

    static get observedAttributes() {
        return ["placeholder", "mostrar-refrescar"];
    }

    get value() {
        return this._valor;
    }

    set value(val) {
        this._valor = String(val || "");
        const input = this._root.querySelector("#inputBuscar");
        if (input && input.value !== this._valor) {
            input.value = this._valor;
        }
    }

    connectedCallback() {
        if (!this._inicializado) {
            const placeholder = this.getAttribute("placeholder") || "Buscar...";
            const mostrarRefrescar = this.hasAttribute("mostrar-refrescar");

            this._root.innerHTML = `
                <style>
                    :host {
                        display: block;
                        width: 100%;
                        font-family: var(--fuente-principal, system-ui, -apple-system, sans-serif);
                    }
                    .controles-busqueda {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        width: 100%;
                    }
                    input[type="search"] {
                        flex: 1;
                        padding: 0.55rem 0.9rem;
                        border: 1.5px solid var(--borde-suave, #d8c6a8);
                        border-radius: 8px;
                        background: #fffdf9;
                        color: var(--coffee-brown, #4B3621);
                        font-size: 0.9rem;
                        outline: none;
                        transition: border-color 0.2s ease, box-shadow 0.2s ease;
                    }
                    input[type="search"]:focus {
                        border-color: var(--coffee-brown, #4B3621);
                        box-shadow: 0 0 0 3px rgba(75, 54, 33, 0.12);
                    }
                    .btn-refrescar {
                        background-color: var(--vanilla-beige, #EDE0C8);
                        color: var(--coffee-brown, #4B3621);
                        border: 1.5px solid var(--borde-suave, #d8c6a8);
                        border-radius: 8px;
                        padding: 0.5rem 0.8rem;
                        font-weight: 700;
                        font-size: 0.95rem;
                        cursor: pointer;
                        transition: background-color 0.15s ease;
                    }
                    .btn-refrescar:hover {
                        background-color: #e2cfa9;
                    }
                </style>
                <div class="controles-busqueda">
                    <input type="search" id="inputBuscar" placeholder="${placeholder}">
                    ${mostrarRefrescar ? `<button type="button" class="btn-refrescar" id="btnRefrescar" title="Actualizar">↻</button>` : ""}
                </div>
            `;

            this._root.querySelector("#inputBuscar").addEventListener("input", (e) => {
                this._valor = e.target.value;
                this.dispatchEvent(new CustomEvent("buscar", {
                    detail: this._valor,
                    bubbles: true,
                    composed: true
                }));
            });

            this._root.querySelector("#btnRefrescar")?.addEventListener("click", () => {
                this.dispatchEvent(new CustomEvent("refrescar", {
                    bubbles: true,
                    composed: true
                }));
            });

            this._inicializado = true;
        }
    }
}

customElements.define("barra-busqueda", BarraBusqueda);
export default BarraBusqueda;