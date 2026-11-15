class BadgeTiempoOrden extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._fecha = null;
        this._prefijo = "";
        this._intervalo = null;
    }

    static get observedAttributes() {
        return ["prefijo"];
    }

    attributeChangedCallback(name, _, nuevo) {
        if (name === "prefijo") {
            this._prefijo = nuevo || "";
            this._actualizar();
        }
    }

    set fecha(valor) {
        this._fecha = valor;
        this._actualizar();
        this._iniciarTimer();
    }

    connectedCallback() {
        this._root.innerHTML = `
            <style>
                :host { display: inline-flex; }
                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 9px;
                    border-radius: 999px;
                    font-size: 0.76rem;
                    font-weight: 700;
                }
                .tiempo-verde { background: #e6f4ea; color: #1e7e34; }
                .tiempo-amarillo { background: #fff3cd; color: #856404; }
                .tiempo-rojo { background: #f8d7da; color: #842029; }
            </style>
            <span class="badge" id="etiqueta" hidden></span>
        `;
        this._actualizar();
        this._iniciarTimer();
    }

    disconnectedCallback() {
        if (this._intervalo) clearInterval(this._intervalo);
    }

    _iniciarTimer() {
        if (this._intervalo) clearInterval(this._intervalo);
        if (!this._fecha) return;
        this._intervalo = setInterval(() => this._actualizar(), 30000);
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

    _actualizar() {
        const span = this._root.querySelector("#etiqueta");
        if (!span) return;

        const creacion = this._parsearFecha(this._fecha);
        if (!creacion) {
            span.hidden = true;
            return;
        }

        const diffMin = Math.max(0, Math.floor((Date.now() - creacion.getTime()) / 60000));
        const tiempoTexto = diffMin === 0 ? "< 1 min" : `${diffMin} min`;
        const clase = diffMin >= 15 ? "tiempo-rojo" : diffMin >= 8 ? "tiempo-amarillo" : "tiempo-verde";

        span.hidden = false;
        span.className = `badge ${clase}`;
        span.textContent = this._prefijo ? `${this._prefijo} ${tiempoTexto}` : `Hace ${tiempoTexto}`;
    }
}

customElements.define("badge-tiempo-orden", BadgeTiempoOrden);
export default BadgeTiempoOrden;