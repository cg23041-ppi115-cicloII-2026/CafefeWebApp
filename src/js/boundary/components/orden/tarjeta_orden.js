import "./tarjeta_horizontal.js";

class TarjetaOrden extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._orden = null;
        this._modo = "pendiente"; // "pendiente" | "lista"
    }

    set datos(valor) {
        this._orden = valor;
        this._dibujar();
    }

    get datos() {
        return this._orden;
    }

    set modo(valor) {
        this._modo = valor;
        this._dibujar();
    }

    connectedCallback() {
        this._dibujar();
    }

    _dibujar() {
        if (!this._orden) return;

        const uidCorto = String(this._orden.idOrden || "0000").slice(-5).toUpperCase();
        const cliente = this._orden.cliente || `Pedido #${uidCorto}`;
        const esPendiente = this._modo === "pendiente";
        const textoBoton = esPendiente ? "Tomar y Preparar" : "Marcar Entregado";
        const nombreEvento = esPendiente ? "tomar-orden" : "entregar-orden";

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/tarjeta_orden.css">
            <tarjeta-horizontal>
                <div slot="titulo">
                    <div class="uid-badge">ORDEN #${uidCorto}</div>
                    <div class="cliente-nombre">${cliente}</div>
                </div>
                <div slot="contenido">
                    <span class="estado-tag ${esPendiente ? "pendiente" : "lista"}">
                        ${esPendiente ? "En espera" : "¡Listo para recoger!"}
                    </span>
                </div>
                <div slot="pie">
                    <button type="button" class="btn-accion ${esPendiente ? "btn-preparar" : "btn-entregar"}" id="btnAccion">
                        ${textoBoton}
                    </button>
                </div>
            </tarjeta-horizontal>
        `;

        this._root.querySelector("#btnAccion").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent(nombreEvento, {
                detail: this._orden,
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("tarjeta-orden", TarjetaOrden);
export default TarjetaOrden;