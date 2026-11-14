class BotonCerrarSesion extends HTMLElement {
    static get observedAttributes() {
        return ["usuario", "texto"];
    }

    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this._dibujar();
    }

    attributeChangedCallback() {
        if (this._root.innerHTML) {
            this._dibujar();
        }
    }

    _dibujar() {
        const usuario = this.getAttribute("usuario") || "";
        const texto = this.getAttribute("texto") || "Cerrar Sesión";

        this._root.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.6rem;
                }

                .usuario-etiqueta {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #EDE0C8;
                    background: rgba(255, 255, 255, 0.12);
                    padding: 0.35rem 0.7rem;
                    border-radius: 999px;
                    white-space: nowrap;
                }

                .btn-logout {
                    background-color: #C8322B;
                    color: #FFFFFF;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    padding: 0.45rem 0.9rem;
                    font-family: inherit;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s ease, transform 0.15s ease;
                    white-space: nowrap;
                }

                .btn-logout:hover {
                    background-color: #A82620;
                    transform: translateY(-1px);
                }

                .btn-logout:active {
                    transform: translateY(0);
                }
            </style>
            ${usuario ? `<span class="usuario-etiqueta">${usuario}</span>` : ""}
            <button type="button" class="btn-logout" id="btnCerrarSesion">${texto}</button>
        `;

        this._root.getElementById("btnCerrarSesion").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("cerrar-sesion", {
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("boton-cerrar-sesion", BotonCerrarSesion);
export default BotonCerrarSesion;