class MensajeError extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._titulo = "Ocurrió un error";
        this._mensaje = "No se pudo completar la operación.";
        this._codigo = null;
        this._mostrarReintentar = false;
    }

    set error(err) {
        if (!err) {
            this._mensaje = "Error desconocido.";
            this._codigo = null;
        } else if (typeof err === "string") {
            this._mensaje = err;
            this._codigo = null;
        } else {
            this._codigo = err.status || err.codigo || null;
            this._mensaje = err.mensaje || err.message || "Error al comunicarse con el servidor.";
        }
        this._dibujar();
    }

    set titulo(valor) {
        this._titulo = valor || "Ocurrió un error";
        this._dibujar();
    }

    set reintentable(valor) {
        this._mostrarReintentar = Boolean(valor);
        this._dibujar();
    }

    connectedCallback() {
        this._dibujar();
    }

    _dibujar() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/mensaje_error.css">

            <div class="alerta-error" role="alert">
                <div class="contenido">
                    <div class="cabecera">
                        <h3 class="titulo">${this._titulo}</h3>
                        ${this._codigo ? `<span class="badge-codigo">HTTP ${this._codigo}</span>` : ""}
                    </div>
                    <p class="detalle">${this._mensaje}</p>
                </div>
                <div class="acciones">
                    ${this._mostrarReintentar ? `<button type="button" class="btn-reintentar" id="btnReintentar">Reintentar</button>` : ""}
                    <button type="button" class="btn-cerrar" id="btnCerrar" title="Cerrar">✕</button>
                </div>
            </div>
        `;

        this._root.querySelector("#btnCerrar").addEventListener("click", () => {
            this.remove();
            this.dispatchEvent(new CustomEvent("cerrar-error", {
                bubbles: true,
                composed: true
            }));
        });

        const btnReintentar = this._root.querySelector("#btnReintentar");
        if (btnReintentar) {
            btnReintentar.addEventListener("click", () => {
                this.dispatchEvent(new CustomEvent("reintentar-operacion", {
                    bubbles: true,
                    composed: true
                }));
            });
        }
    }
}

customElements.define("mensaje-error", MensajeError);
export default MensajeError;