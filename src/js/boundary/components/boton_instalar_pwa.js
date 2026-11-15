const STORAGE_KEY_INSTALADA = "cafefe_pwa_instalada";

class BotonInstalarPwa extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._eventoInstalacion = null;
        this._instalada = false;

        this._onBeforeInstallPrompt = (e) => {
            e.preventDefault();
            // Si el navegador ofrece instalarla, significa que no está instalada (o fue desinstalada)
            localStorage.removeItem(STORAGE_KEY_INSTALADA);
            this._instalada = false;
            this._eventoInstalacion = e;
            this._dibujar();
        };

        this._onAppInstalled = () => {
            localStorage.setItem(STORAGE_KEY_INSTALADA, "true");
            this._eventoInstalacion = null;
            this._instalada = true;
            this._dibujar();
        };

        this._onStorageChange = (e) => {
            if (e.key === STORAGE_KEY_INSTALADA) {
                this._instalada = e.newValue === "true";
                this._dibujar();
            }
        };
    }

    async connectedCallback() {
        window.addEventListener("beforeinstallprompt", this._onBeforeInstallPrompt);
        window.addEventListener("appinstalled", this._onAppInstalled);
        window.addEventListener("storage", this._onStorageChange);

        await this._verificarEstadoInstalacion();
        this._dibujar();
    }

    disconnectedCallback() {
        window.removeEventListener("beforeinstallprompt", this._onBeforeInstallPrompt);
        window.removeEventListener("appinstalled", this._onAppInstalled);
        window.removeEventListener("storage", this._onStorageChange);
    }

    async _verificarEstadoInstalacion() {
        // 1. Abierta directamente como ventana de app instalada
        const enModoStandalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true;

        if (enModoStandalone) {
            localStorage.setItem(STORAGE_KEY_INSTALADA, "true");
            this._instalada = true;
            return;
        }

        // 2. Consulta nativa del navegador sobre PWAs instaladas del mismo origen
        if ("getInstalledRelatedApps" in navigator) {
            try {
                const apps = await navigator.getInstalledRelatedApps();
                if (apps.length > 0) {
                    localStorage.setItem(STORAGE_KEY_INSTALADA, "true");
                    this._instalada = true;
                    return;
                }
            } catch {
                // Continuar al respaldo en localStorage
            }
        }

        // 3. Estado guardado previamente en este navegador/origen
        this._instalada = localStorage.getItem(STORAGE_KEY_INSTALADA) === "true";
    }

    async _instalarApp() {
        if (this._eventoInstalacion) {
            this._eventoInstalacion.prompt();
            const { outcome } = await this._eventoInstalacion.userChoice;
            if (outcome === "accepted") {
                localStorage.setItem(STORAGE_KEY_INSTALADA, "true");
                this._eventoInstalacion = null;
                this._instalada = true;
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
            this.hidden = true;
            this.style.display = "none";
            this._root.innerHTML = "";
            this.dispatchEvent(new CustomEvent("estado-pwa-cambio", {
                detail: { instalada: true },
                bubbles: true,
                composed: true
            }));
            return;
        }

        this.hidden = false;
        this.style.display = "inline-block";
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