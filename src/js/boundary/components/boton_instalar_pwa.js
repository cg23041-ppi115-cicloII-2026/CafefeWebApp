class BotonInstalarPwa extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._eventoInstalacion = null;
        this._instalada = false;
    }

    connectedCallback() {
        this._dibujar();

        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            this._eventoInstalacion = e;
            this._dibujar();
        });

        window.addEventListener("appinstalled", () => {
            this._eventoInstalacion = null;
            this._instalada = true;
            this._dibujar();
        });
    }

    async _instalarApp() {
        if (this._eventoInstalacion) {
            this._eventoInstalacion.prompt();
            const { outcome } = await this._eventoInstalacion.userChoice;
            if (outcome === "accepted") {
                this._eventoInstalacion = null;
            }
            this._dibujar();
            return;
        }

        this.dispatchEvent(new CustomEvent("solicitar-instalacion-pwa", {
            bubbles: true,
            composed: true
        }));
    }

    _dibujar() {
        if (this._instalada) {
            this._root.innerHTML = "";
            return;
        }

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/boton_instalar_pwa.css">
            <button type="button" class="btn-instalar" id="btnInstalarPwa" title="Instalar aplicación Cafefe">
                <svg class="icono-descarga" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Instalar App</span>
            </button>
        `;

        this._root.querySelector("#btnInstalarPwa").addEventListener("click", () => {
            this._instalarApp();
        });
    }
}

customElements.define("boton-instalar-pwa", BotonInstalarPwa);
export default BotonInstalarPwa;