import TarjetaSimple from "./tarjeta_simple.js";
import TipoProducto from "../../entity/tipo_producto.js";

class TarjetTipoProducto extends HTMLElement {
    constructor() {
        super();
        this.tipoProducto = new TipoProducto();
        this.tarjeta = new TarjetaSimple();
    }

    /**
     * Asigna los datos de la entidad TipoProducto al componente
     * @param {TipoProducto} tipoProducto
     */
    set datos(tipoProducto) {
        this.tipoProducto = tipoProducto;
    }

    connectedCallback() {
        this.tarjeta.innerHTML = "";

        // 1. Título -> this.tipoProducto.nombre
        let titulo = document.createElement("p");
        titulo.setAttribute("slot", "titulo");
        titulo.innerText = this.tipoProducto.nombre || "Sin nombre";

        // 2. Contenido -> this.tipoProducto.observaciones
        let contenido = document.createElement("p");
        contenido.setAttribute("slot", "contenido");
        contenido.innerText = this.tipoProducto.observaciones || "Sin observaciones";

        // 3. Pie -> this.tipoProducto.activo
        let pie = document.createElement("span");
        pie.setAttribute("slot", "pie");
        pie.innerText = this.tipoProducto.activo ? "Activo" : "Inactivo";

        this.tarjeta.appendChild(titulo);
        this.tarjeta.appendChild(contenido);
        this.tarjeta.appendChild(pie);

        this.appendChild(this.tarjeta);
    }
}

customElements.define("tarjeta-tipoproducto", TarjetTipoProducto);
export default TarjetTipoProducto;