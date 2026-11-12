import { html, render } from '../../../lib/lit-html.js';

class ResumenOrden extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
        this._items = [];
    }

    set items(valor) {
        this._items = Array.isArray(valor) ? valor : [];
        this._dibujar();
    }

    get items() {
        return this._items;
    }

    connectedCallback() {
        this._dibujar();
    }

    _calcularTotal() {
        return this._items.reduce((acc, item) => acc + (Number(item.precio) * Number(item.cantidad)), 0);
    }

    _cambiarCantidad(index, delta) {
        this.dispatchEvent(new CustomEvent('actualizar-cantidad', {
            detail: { index, delta },
            bubbles: true,
            composed: true
        }));
    }

    _seguirPidiendo() {
        this.dispatchEvent(new CustomEvent('seguir-pidiendo', {
            bubbles: true,
            composed: true
        }));
    }

    _confirmarOrden() {
        if (this._items.length === 0) return;
        this.dispatchEvent(new CustomEvent('confirmar-orden', {
            detail: {
                items: this._items,
                total: this._calcularTotal()
            },
            bubbles: true,
            composed: true
        }));
    }

    _template() {
        const total = this._calcularTotal().toFixed(2);

        return html`
            <link rel="stylesheet" href="./resources/estilos/resumen_orden.css">
            <section class="resumen-layout" id="resumenOrdenLayout">
                
                <div class="carrito-lista-box">
                    <h2 class="resumen-titulo">Resumen del Carrito</h2>
                    ${this._items.length > 0
                        ? this._items.map((item, idx) => html`
                            <div class="carrito-item" id="itemCarrito-${idx}">
                                <img src="${item.imagen || './resources/img/default_cafe.png'}" alt="${item.nombre}" class="item-img">
                                <div class="item-datos">
                                    <h3 class="item-nombre">${item.nombre}</h3>
                                    <span class="item-meta">Tamaño: ${item.tamano || 'M'} · $${Number(item.precio).toFixed(2)} c/u</span>
                                    <div class="item-controles">
                                        <button type="button" class="btn-mini" @click=${() => this._cambiarCantidad(idx, -1)}>-</button>
                                        <span>${item.cantidad}</span>
                                        <button type="button" class="btn-mini" @click=${() => this._cambiarCantidad(idx, 1)}>+</button>
                                    </div>
                                </div>
                                <div class="item-subtotal">
                                    $${(Number(item.precio) * Number(item.cantidad)).toFixed(2)}
                                </div>
                            </div>
                        `)
                        : html`<p class="carrito-vacio">Tu carrito está vacío.</p>`
                    }
                </div>

                <aside class="pedido-panel">
                    <div class="pedido-caja">
                        <h2 class="panel-titulo">Resumen del Pedido</h2>
                        <div class="linea-resumen">
                            <span>Subtotal:</span>
                            <span>$${total}</span>
                        </div>
                        <div class="linea-resumen">
                            <span>Modalidad:</span>
                            <span>Para recoger</span>
                        </div>
                        <hr class="divisor">
                        <div class="linea-total">
                            <span>TOTAL:</span>
                            <span>$${total}</span>
                        </div>

                        <div class="aviso-local" id="avisoPagoLocal">
                            Pago en local al recoger (Orden pendiente)
                        </div>
                    </div>

                    <button type="button" class="btn-seguir" id="btnSeguirPidiendo" @click=${() => this._seguirPidiendo()}>
                        Seguir pidiendo
                    </button>

                    <button 
                        type="button" 
                        class="btn-confirmar" 
                        id="btnConfirmarOrden"
                        ?disabled=${this._items.length === 0}
                        @click=${() => this._confirmarOrden()}>
                        Confirmar Orden
                    </button>
                </aside>
            </section>
        `;
    }

    _dibujar() {
        render(this._template(), this._root);
    }
}

customElements.define('resumen-orden', ResumenOrden);
export default ResumenOrden;