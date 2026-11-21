import "./tarjeta_simple.js";
import TipoProducto from "../../entity/tipo_producto.js";

class TarjetaTipoProducto extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._tipoProducto = new TipoProducto();
    }

    set datos(tipoProducto) {
        this._tipoProducto = tipoProducto || new TipoProducto();
        this._dibujar();
    }

    get datos() {
        return this._tipoProducto;
    }

    connectedCallback() {
        this._dibujar();
    }

    _manejarClick() {
        this.dispatchEvent(new CustomEvent("seleccionar-tipo-producto", {
            detail: this._tipoProducto,
            bubbles: true,
            composed: true
        }));
    }

    _dibujar() {
        const tp = this._tipoProducto;
        const estadoTexto = tp.activo ? "Activo" : "Inactivo";

        this._root.innerHTML = `
            <tarjeta-simple id="tarjetaTipo-${tp.idTipoProducto || "nuevo"}">
                <p slot="titulo">${tp.nombre || "Sin nombre"}</p>
                <p slot="contenido">${tp.observaciones || "Sin observaciones"}</p>
                <span slot="pie">${estadoTexto}</span>
            </tarjeta-simple>
        `;

        const tarjeta = this._root.querySelector("tarjeta-simple");
        if (tarjeta) {
            tarjeta.addEventListener("click", () => this._manejarClick());
        }
    }
}

customElements.define("tarjeta-tipoproducto", TarjetaTipoProducto);
export default TarjetaTipoProducto;