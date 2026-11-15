import "./tarjeta_horizontal.js";
import "./badge_tiempo_orden.js";

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
        const nombreCliente = this._orden.clienteNombre || `Pedido #${uidCorto}`;
        const esPendiente = this._modo === "pendiente";
        const textoBoton = esPendiente ? "Tomar y Preparar" : "Marcar Entregado";
        const nombreEvento = esPendiente ? "tomar-orden" : "entregar-orden";

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/tarjeta_orden.css">
            <tarjeta-horizontal>
                <div slot="titulo">
                    <div class="uid-badge">ORDEN #${uidCorto}</div>
                    <div class="cliente-nombre"></div>
                    <div class="badges-contenedor">
                        ${esPendiente ? `<badge-tiempo-orden id="badgeTiempo"></badge-tiempo-orden>` : ""}
                    </div>
                </div>
                <div slot="contenido">
                    <span class="estado-tag ${esPendiente ? "pendiente" : "lista"}">
                        ${esPendiente ? "En espera" : "Listo para recoger"}
                    </span>
                </div>
                <div slot="pie">
                    <div class="pie-botones">
                        <button type="button" class="btn-accion ${esPendiente ? "btn-preparar" : "btn-entregar"}" id="btnAccion">
                            ${textoBoton}
                        </button>
                        ${esPendiente ? `<button type="button" class="btn-accion btn-cancelar" id="btnCancelar">Cancelar</button>` : ""}
                    </div>
                </div>
            </tarjeta-horizontal>
        `;

        this._root.querySelector(".cliente-nombre").textContent = nombreCliente;

        const badge = this._root.querySelector("#badgeTiempo");
        if (badge) badge.fecha = this._orden.fechaCreacion || this._orden.fecha_creacion;

        this._root.querySelector("#btnAccion").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent(nombreEvento, {
                detail: this._orden,
                bubbles: true,
                composed: true
            }));
        });

        this._root.querySelector("#btnCancelar")?.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("cancelar-orden", {
                detail: this._orden,
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("tarjeta-orden", TarjetaOrden);
export default TarjetaOrden;