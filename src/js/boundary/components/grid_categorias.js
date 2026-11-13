import { html, render } from '../../lib/lit-html.js';
import './tarjeta_simple.js';

class GridCategorias extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
        this._categorias = [];
        this._titulo = '¿Algo dulce para hoy?';
    }

    static get observedAttributes() {
        return ['titulo'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'titulo' && oldVal !== newVal) {
            this._titulo = newVal || '';
            this._dibujar();
        }
    }

    set categorias(valor) {
        this._categorias = Array.isArray(valor) ? valor : [];
        this._dibujar();
    }

    get categorias() {
        return this._categorias;
    }

    connectedCallback() {
        this._dibujar();
    }

    _seleccionarCategoria(categoria) {
        this.dispatchEvent(new CustomEvent('categoria-seleccionada', {
            detail: categoria,
            bubbles: true,
            composed: true
        }));
    }

    _template() {
        return html`
            <link rel="stylesheet" href="./resources/estilos/components/grid_categorias.css">
            <section class="categorias-seccion" id="seccionCategorias">
                ${this._titulo ? html`
                    <h1 class="categorias-titulo" id="tituloCategorias">${this._titulo}</h1>
                ` : ''}

                <div class="categorias-grid" id="gridCategorias">
                    ${this._categorias.length > 0
                        ? this._categorias.map(cat => html`
                            <tarjeta-simple 
                                id="cardCat-${cat.idTipoProducto}"
                                @click=${() => this._seleccionarCategoria(cat)}>
                                
                                <div slot="titulo" class="cat-imagen-box">
                                    <img 
                                        src="${cat.imagen || './resources/img/default_cafe.png'}" 
                                        alt="${cat.nombre}" 
                                        class="cat-imagen"
                                        id="imgCat-${cat.idTipoProducto}">
                                </div>

                                <div slot="contenido" class="cat-nombre-box">
                                    <span class="cat-nombre" id="nombreCat-${cat.idTipoProducto}">${cat.nombre}</span>
                                </div>

                                <div slot="pie" class="cat-pie">
                                    <span>Explorar</span>
                                    <span>→</span>
                                </div>
                            </tarjeta-simple>
                        `)
                        : html`<p class="estado-vacio" id="categoriasVacias">No hay categorías disponibles.</p>`
                    }
                </div>
            </section>
        `;
    }

    _dibujar() {
        render(this._template(), this._root);
    }
}

customElements.define('grid-categorias', GridCategorias);
export default GridCategorias;