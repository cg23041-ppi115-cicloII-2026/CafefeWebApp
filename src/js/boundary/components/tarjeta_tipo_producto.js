import { html, render } from '../../lib/lit-html.js';
import './tarjeta_simple.js';
import TipoProducto from '../../entity/tipo_producto.js';

class TarjetaTipoProducto extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
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
        this.dispatchEvent(new CustomEvent('seleccionar-tipo-producto', {
            detail: this._tipoProducto,
            bubbles: true,
            composed: true
        }));
    }

    _template() {
        const tp = this._tipoProducto;

        return html`
            <tarjeta-simple 
                id="tarjetaTipo-${tp.idTipoProducto || 'nuevo'}"
                @click=${() => this._manejarClick()}>
                <p slot="titulo">${tp.nombre || 'Sin nombre'}</p>
                <p slot="contenido">${tp.observaciones || 'Sin observaciones'}</p>
                <span slot="pie">${tp.activo ? 'Activo' : 'Inactivo'}</span>
            </tarjeta-simple>
        `;
    }

    _dibujar() {
        render(this._template(), this._root);
    }
}

customElements.define('tarjeta-tipoproducto', TarjetaTipoProducto);
export default TarjetaTipoProducto;