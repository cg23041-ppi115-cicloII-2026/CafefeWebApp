import '../tarjeta_simple.js';

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

    _dibujar() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/grid_categorias.css">
            <section class="categorias-seccion" id="seccionCategorias">
                ${this._titulo ? `<h1 class="categorias-titulo" id="tituloCategorias">${this._titulo}</h1>` : ''}
                <div class="categorias-grid" id="gridCategorias"></div>
            </section>
        `;

        const grid = this._root.getElementById('gridCategorias');

        if (this._categorias.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'estado-vacio';
            vacio.id = 'categoriasVacias';
            vacio.textContent = 'No hay categorías disponibles.';
            grid.appendChild(vacio);
            return;
        }

        this._categorias.forEach(cat => {
            const card = document.createElement('tarjeta-simple');
            card.id = `cardCat-${cat.idTipoProducto}`;
            card.addEventListener('click', () => this._seleccionarCategoria(cat));

            const imagenSrc = cat.imagen || './resources/img/logo_cafe.png';

            card.innerHTML = `
                <div slot="titulo" class="cat-imagen-box">
                    <img 
                        src="${imagenSrc}" 
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
            `;

            grid.appendChild(card);
        });
    }
}

customElements.define('grid-categorias', GridCategorias);
export default GridCategorias;