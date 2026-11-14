import "./tarjeta_horizontal.js";

class TarjetaOrden extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._orden = null;
        this._modo = "pendiente"; // "pendiente" | "lista"
        this._intervaloTiempo = null;
    }

    set datos(valor) {
        this._orden = valor;
        this._dibujar();
        this._iniciarTimer();
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
        this._iniciarTimer();
    }

    disconnectedCallback() {
        if (this._intervaloTiempo) {
            clearInterval(this._intervaloTiempo);
        }
    }

    _iniciarTimer() {
        if (this._intervaloTiempo) clearInterval(this._intervaloTiempo);
        this._intervaloTiempo = setInterval(() => {
            this._actualizarIndicadorTiempo();
        }, 30000);
    }

    _parsearFecha(fecha) {
        if (!fecha) return null;
        if (Array.isArray(fecha)) {
            const [anio, mes, dia, hora = 0, min = 0, seg = 0] = fecha;
            return new Date(anio, mes - 1, dia, hora, min, seg);
        }
        const limpia = String(fecha).trim().replace(/\[.*\]$/, "");
        const d = new Date(limpia);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    _calcularTiempoEspera() {
        const fecha = this._orden?.fechaCreacion || this._orden?.fecha_creacion;
        const creacion = this._parsearFecha(fecha);
        if (!creacion) {
            return { texto: "", clase: "" };
        }
        const diffMs = Date.now() - creacion.getTime();
        const diffMin = Math.max(0, Math.floor(diffMs / 60000));

        const texto = diffMin === 0 ? "Hace un momento" : `Hace ${diffMin} min`;
        let clase = "tiempo-verde";

        if (diffMin >= 15) {
            clase = "tiempo-rojo";
        } else if (diffMin >= 8) {
            clase = "tiempo-amarillo";
        }

        return { texto, clase };
    }

    _actualizarIndicadorTiempo() {
        const span = this._root.querySelector("#badgeTiempo");
        if (!span) return;
        const { texto, clase } = this._calcularTiempoEspera();
        if (texto) {
            span.textContent = texto;
            span.className = `tiempo-badge ${clase}`;
        }
    }

    _dibujar() {
        if (!this._orden) return;

        const uidCorto = String(this._orden.idOrden || "0000").slice(-5).toUpperCase();
        const esPendiente = this._modo === "pendiente";
        const textoBoton = esPendiente ? "Tomar y Preparar" : "Marcar Entregado";
        const nombreEvento = esPendiente ? "tomar-orden" : "entregar-orden";
        const { texto: textoTiempo, clase: claseTiempo } = this._calcularTiempoEspera();
        const tiempoBadgeHTML = textoTiempo
            ? `<span id="badgeTiempo" class="tiempo-badge ${claseTiempo}">${textoTiempo}</span>`
            : "";

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/tarjeta_orden.css">
            <tarjeta-horizontal>
                <div slot="titulo">
                    <div class="uid-badge">ORDEN #${uidCorto}</div>
                    <div class="cliente-nombre">Pedido #${uidCorto}</div>
                    <div class="badges-contenedor">
                        ${tiempoBadgeHTML}
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
                        ${esPendiente ? `
                            <button type="button" class="btn-accion btn-cancelar" id="btnCancelar">
                                Cancelar
                            </button>
                        ` : ""}
                    </div>
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

        const btnCancelar = this._root.querySelector("#btnCancelar");
        if (btnCancelar) {
            btnCancelar.addEventListener("click", () => {
                this.dispatchEvent(new CustomEvent("cancelar-orden", {
                    detail: this._orden,
                    bubbles: true,
                    composed: true
                }));
            });
        }
    }
}

customElements.define("tarjeta-orden", TarjetaOrden);
export default TarjetaOrden;