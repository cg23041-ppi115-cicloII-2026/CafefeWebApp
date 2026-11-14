import "./boton_instalar_pwa.js";

class CafefeNavbar extends HTMLElement {
    static get observedAttributes() {
        return ["titulo", "logo", "ocultar-instalar"];
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
        const titulo = this.getAttribute("titulo") || "Cafefe";
        const logo = this.getAttribute("logo") || "./resources/img/logo_cafe.png";
        const ocultarInstalar = this.hasAttribute("ocultar-instalar");

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/cafefe_navbar.css">
            <header class="navbar">
                <div class="navbar-marca">
                    <img src="${logo}" alt="Logo Cafefe" class="navbar-logo">
                    <h1 class="navbar-titulo">${titulo}</h1>
                </div>

                <div class="navbar-acciones">
                    <slot></slot>
                    ${ocultarInstalar ? "" : `<boton-instalar-pwa></boton-instalar-pwa>`}
                </div>
            </header>
        `;
    }
}

customElements.define("cafefe-navbar", CafefeNavbar);
export default CafefeNavbar;