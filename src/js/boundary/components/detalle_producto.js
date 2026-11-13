import { html, render } from '../../lib/lit-html.js';

class DetalleProducto extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
        this._producto = null;
        this._tamanoSeleccionado = 'M';
        this._cantidad = 1;
        this._soloVista = false;
    }

    static get observedAttributes() {
        return ['solo-vista'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'solo-vista' && oldVal !== newVal) {
            this._soloVista = newVal !== null && newVal !== 'false';
            this._dibujar();
        }
    }

    set producto(valor) {
        this._producto = valor || null;
        this._cantidad = 1;
        const tamanos = this._producto?.tamanos || ['S', 'M', 'L'];
        this._tamanoSeleccionado = tamanos[0] || 'M';
        this._dibujar();
    }

    get producto() {
        return this._producto;
    }

    connectedCallback() {
        this._dibujar();
    }

    _cambiarCantidad(delta) {
        const nueva = this._cantidad + delta;
        if (nueva >= 1) {
            this._cantidad = nueva;
            this._dibujar();
        }
    }

    _seleccionarTamano(tam) {
        this._tamanoSeleccionado = tam;
        this._dibujar();
    }

    _calcularTotal() {
        if (!this._producto) return 0;
        return Number(this._producto.precioSugerido || 0) * this._cantidad;
    }

    _agregarAlCarrito() {
        if (!this._producto) return;
        this.dispatchEvent(new CustomEvent('agregar-carrito', {
            detail: {
                producto: this._producto,
                tamano: this._tamanoSeleccionado,
                cantidad: this._cantidad,
                subtotal: this._calcularTotal()
            },
            bubbles: true,
            composed: true
        }));
    }

    _regresar() {
        this.dispatchEvent(new CustomEvent('regresar', {
            bubbles: true,
            composed: true
        }));
    }

    _template() {
        if (!this._producto) {
            return html`<p>Seleccione un producto.</p>`;
        }

        const p = this._producto;
        const tamanos = p.tamanos && p.tamanos.length > 0 ? p.tamanos : ['S', 'M', 'L'];
        const total = this._calcularTotal().toFixed(2);

        return html`
            <link rel="stylesheet" href="./resources/estilos/components/detalle_producto.css">
            <section class="detalle-contenedor" id="detalleProductoContenedor">
                <div class="detalle-imagen-box">
                    <img 
                        src="${p.imagen || './resources/img/default_cafe.png'}" 
                        alt="${p.nombre}" 
                        class="detalle-imagen"
                        id="imgDetalle-${p.idProducto}">
                </div>

                <div class="detalle-info">
                    <h1 class="detalle-nombre" id="nombreDetalle">${p.nombre}</h1>
                    <p class="detalle-categoria"><strong>Categoría:</strong> ${p.nombreTipoProducto || p.subcategoria || 'General'}</p>
                    <p class="detalle-descripcion">${p.comentarios || 'Sin descripción disponible.'}</p>
                    <div class="detalle-precio">$${Number(p.precioSugerido || 0).toFixed(2)}</div>

                    ${!this._soloVista ? html`
                        <div class="detalle-controles">
                            <div class="control-grupo">
                                <span class="control-label">Tamaño:</span>
                                <div class="tamanos-opciones">
                                    ${tamanos.map(tam => html`
                                        <button 
                                            type="button"
                                            class="btn-tamano ${this._tamanoSeleccionado === tam ? 'activo' : ''}"
                                            id="btnTam-${tam}"
                                            @click=${() => this._seleccionarTamano(tam)}>
                                            ${tam}
                                        </button>
                                    `)}
                                </div>
                            </div>

                            <div class="control-grupo">
                                <span class="control-label">Cantidad:</span>
                                <div class="contador-box">
                                    <button type="button" class="btn-cant" id="btnMenos" @click=${() => this._cambiarCantidad(-1)}>-</button>
                                    <span class="valor-cant" id="valorCantidad">${this._cantidad}</span>
                                    <button type="button" class="btn-cant" id="btnMas" @click=${() => this._cambiarCantidad(1)}>+</button>
                                </div>
                            </div>
                        </div>

                        <div class="detalle-acciones">
                            <button 
                                type="button" 
                                class="btn-agregar-carrito" 
                                id="btnAgregarCarrito"
                                @click=${() => this._agregarAlCarrito()}>
                                Agregar al carrito ($${total})
                            </button>

                            <button 
                                type="button" 
                                class="btn-regresar" 
                                id="btnRegresar"
                                @click=${() => this._regresar()}>
                                Regresar
                            </button>
                        </div>
                    ` : html`
                        <button type="button" class="btn-regresar" @click=${() => this._regresar()}>Regresar</button>
                    `}
                </div>
            </section>
        `;
    }

    _dibujar() {
        render(this._template(), this._root);
    }
}

customElements.define('detalle-producto', DetalleProducto);
export default DetalleProducto;