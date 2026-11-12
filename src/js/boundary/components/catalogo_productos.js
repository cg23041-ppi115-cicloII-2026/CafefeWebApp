import { html, render } from '../../../lib/lit-html.js';
import './tarjeta_simple.js';

class CatalogoProductos extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
        this._categorias = [];
        this._productos = [];
        this._categoriaActivaId = null;
        this._subcategoriaActiva = 'Todas';
        this._cantidadCarrito = 0;
        this._modoLectura = false;
    }

    static get observedAttributes() {
        return ['modo'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'modo' && oldVal !== newVal) {
            this._modoLectura = newVal === 'lectura';
            this._dibujar();
        }
    }

    set categorias(valor) {
        this._categorias = Array.isArray(valor) ? valor : [];
        if (!this._categoriaActivaId && this._categorias.length > 0) {
            this._categoriaActivaId = this._categorias[0].idTipoProducto;
        }
        this._dibujar();
    }

    get categorias() {
        return this._categorias;
    }

    set categoriaActivaId(id) {
        this._categoriaActivaId = id;
        this._subcategoriaActiva = 'Todas';
        this._dibujar();
    }

    get categoriaActivaId() {
        return this._categoriaActivaId;
    }

    set productos(valor) {
        this._productos = Array.isArray(valor) ? valor : [];
        this._dibujar();
    }

    get productos() {
        return this._productos;
    }

    set cantidadCarrito(valor) {
        this._cantidadCarrito = Number(valor) || 0;
        this._dibujar();
    }

    get cantidadCarrito() {
        return this._cantidadCarrito;
    }

    connectedCallback() {
        this._dibujar();
    }

    _cambiarCategoria(idCategoria) {
        this._categoriaActivaId = idCategoria;
        this._subcategoriaActiva = 'Todas';
        this._dibujar();
    }

    _cambiarSubcategoria(sub) {
        this._subcategoriaActiva = sub;
        this._dibujar();
    }

    _obtenerProductosPorCategoria() {
        if (!this._categoriaActivaId) return this._productos;
        return this._productos.filter(p => p.idTipoProducto === this._categoriaActivaId);
    }

    _obtenerSubcategorias() {
        const prodsCat = this._obtenerProductosPorCategoria();
        const subs = new Set(prodsCat.map(p => p.subcategoria).filter(Boolean));
        return ['Todas', ...Array.from(subs)];
    }

    _obtenerProductosFiltrados() {
        const prodsCat = this._obtenerProductosPorCategoria();
        if (this._subcategoriaActiva === 'Todas') return prodsCat;
        return prodsCat.filter(p => p.subcategoria === this._subcategoriaActiva);
    }

    _emitirSeleccionProducto(producto) {
        this.dispatchEvent(new CustomEvent('seleccionar-producto', {
            detail: producto,
            bubbles: true,
            composed: true
        }));
    }

    _emitirAgregarRapido(e, producto) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('agregar-rapido', {
            detail: producto,
            bubbles: true,
            composed: true
        }));
    }

    _emitirVerOrden() {
        this.dispatchEvent(new CustomEvent('ver-orden', {
            bubbles: true,
            composed: true
        }));
    }

    _template() {
        const subcategorias = this._obtenerSubcategorias();
        const productosVisibles = this._obtenerProductosFiltrados();

        return html`
            <link rel="stylesheet" href="./resources/estilos/catalogo_productos.css">
            <div class="catalogo-layout" id="catalogoLayout">
                
                <aside class="sidebar-categorias" id="sidebarCategorias">
                    <h2 class="sidebar-titulo">Categorías</h2>
                    <ul class="sidebar-lista" id="listaSidebar">
                        ${this._categorias.map(cat => html`
                            <li>
                                <button 
                                    type="button"
                                    class="sidebar-btn ${cat.idTipoProducto === this._categoriaActivaId ? 'activa' : ''}"
                                    id="btnCat-${cat.idTipoProducto}"
                                    @click=${() => this._cambiarCategoria(cat.idTipoProducto)}>
                                    ${cat.nombre}
                                </button>
                            </li>
                        `)}
                    </ul>
                </aside>

                <main class="catalogo-principal" id="catalogoPrincipal">
                    <div class="barra-superior-catalogo">
                        <div class="tabs-subcategorias" id="tabsSubcategorias">
                            ${subcategorias.map(sub => html`
                                <button 
                                    type="button"
                                    class="tab-btn ${sub === this._subcategoriaActiva ? 'activa' : ''}"
                                    id="tabSub-${sub}"
                                    @click=${() => this._cambiarSubcategoria(sub)}>
                                    ${sub}
                                </button>
                            `)}
                        </div>

                        ${!this._modoLectura && this._cantidadCarrito > 0 ? html`
                            <button 
                                type="button" 
                                class="btn-guardar-orden" 
                                id="btnGuardarOrden"
                                @click=${() => this._emitirVerOrden()}>
                                Guardar (${this._cantidadCarrito})
                            </button>
                        ` : ''}
                    </div>

                    <div class="productos-grid" id="gridProductos">
                        ${productosVisibles.length > 0
                            ? productosVisibles.map(prod => html`
                                <tarjeta-simple 
                                    id="cardProd-${prod.idProducto}"
                                    @click=${() => this._emitirSeleccionProducto(prod)}>
                                    
                                    <div slot="titulo" class="prod-img-wrap">
                                        <img 
                                            src="${prod.imagen || './resources/img/default_cafe.png'}" 
                                            alt="${prod.nombre}" 
                                            class="prod-img">
                                    </div>

                                    <div slot="contenido" class="prod-info">
                                        <h3 class="prod-nombre">${prod.nombre}</h3>
                                        <p class="prod-desc">${prod.comentarios || ''}</p>
                                    </div>

                                    <div slot="pie" class="prod-footer">
                                        <span class="prod-precio">$${Number(prod.precioSugerido || 0).toFixed(2)}</span>
                                        ${!this._modoLectura ? html`
                                            <button 
                                                type="button" 
                                                class="btn-agregar-card"
                                                id="btnAdd-${prod.idProducto}"
                                                @click=${(e) => this._emitirAgregarRapido(e, prod)}>
                                                Agregar
                                            </button>
                                        ` : ''}
                                    </div>
                                </tarjeta-simple>
                            `)
                            : html`<p class="estado-vacio">No hay productos en esta sección.</p>`
                        }
                    </div>
                </main>
            </div>
        `;
    }

    _dibujar() {
        render(this._template(), this._root);
    }
}

customElements.define('catalogo-productos', CatalogoProductos);
export default CatalogoProductos;