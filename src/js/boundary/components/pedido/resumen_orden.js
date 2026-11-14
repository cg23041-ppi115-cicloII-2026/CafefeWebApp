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

    _dibujar() {
        const total = this._calcularTotal().toFixed(2);

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/resumen_orden.css">
            <section class="resumen-layout" id="resumenOrdenLayout">
                
                <div class="carrito-lista-box" id="carritoListaBox">
                    <h2 class="resumen-titulo">Resumen del Carrito</h2>
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

                    <button type="button" class="btn-seguir" id="btnSeguirPidiendo">
                        Seguir pidiendo
                    </button>

                    <button 
                        type="button" 
                        class="btn-confirmar" 
                        id="btnConfirmarOrden"
                        ${this._items.length === 0 ? 'disabled' : ''}>
                        Confirmar Orden
                    </button>
                </aside>
            </section>
        `;

        const listaBox = this._root.getElementById('carritoListaBox');

        if (this._items.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'carrito-vacio';
            vacio.textContent = 'Tu carrito está vacío.';
            listaBox.appendChild(vacio);
        } else {
            this._items.forEach((item, idx) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'carrito-item';
                itemDiv.id = `itemCarrito-${idx}`;

                const precioUnitario = Number(item.precio).toFixed(2);
                const subtotalItem = (Number(item.precio) * Number(item.cantidad)).toFixed(2);
                const imagenSrc = item.imagen || './resources/img/default_cafe.png';

                itemDiv.innerHTML = `
                    <img src="${imagenSrc}" alt="${item.nombre}" class="item-img">
                    <div class="item-datos">
                        <h3 class="item-nombre">${item.nombre}</h3>
                        <span class="item-meta">${item.personalizacion || 'Estándar'} · $${precioUnitario} c/u</span>
                        <div class="item-controles">
                            <button type="button" class="btn-mini btn-restar">-</button>
                            <span>${item.cantidad}</span>
                            <button type="button" class="btn-mini btn-sumar">+</button>
                        </div>
                    </div>
                    <div class="item-subtotal">
                        $${subtotalItem}
                    </div>
                `;

                itemDiv.querySelector('.btn-restar').addEventListener('click', () => this._cambiarCantidad(idx, -1));
                itemDiv.querySelector('.btn-sumar').addEventListener('click', () => this._cambiarCantidad(idx, 1));

                listaBox.appendChild(itemDiv);
            });
        }

        this._root.getElementById('btnSeguirPidiendo').addEventListener('click', () => this._seguirPidiendo());
        this._root.getElementById('btnConfirmarOrden').addEventListener('click', () => this._confirmarOrden());
    }
}

customElements.define('resumen-orden', ResumenOrden);
export default ResumenOrden;