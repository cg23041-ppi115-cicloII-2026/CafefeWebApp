import TarjetaTipoProducto from "./components/tarjeta_tipo_producto.js";
import TipoProductoDAO from "../control/tipo_producto_dao.js";

class TipoProductoModel extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.tipoProductoDAO = new TipoProductoDAO();
        this.registros = [];
    }

    connectedCallback() {
        this.tipoProductoDAO.findRange(0, 50).then(resp => {
            this.registros = resp.datos || [];
            this.root.innerHTML = "";

            this.registros.forEach(tipoProducto => {
                let tarjeta = new TarjetaTipoProducto();
                tarjeta.datos = tipoProducto; // Llama al setter y dispara _dibujar()
                this.root.appendChild(tarjeta);
            });
        }).catch(err => {
            // TODO: crear componente para errores
            console.error(err);
        });
    }
}

customElements.define("tipoproducto-model", TipoProductoModel);
export default TipoProductoModel;