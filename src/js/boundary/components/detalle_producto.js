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

    _dibujar() {
        if (!this._producto) {
            this._root.innerHTML = `<p>Seleccione un producto.</p>`;
            return;
        }

        const p = this._producto;
        const tamanos = p.tamanos && p.tamanos.length > 0 ? p.tamanos : ['S', 'M', 'L'];
        const total = this._calcularTotal().toFixed(2);
        const precioUnitario = Number(p.precioSugerido || 0).toFixed(2);
        const imagenSrc = p.imagen || './resources/img/logo_cafe.png';
        const categoriaNombre = p.nombreTipoProducto || p.subcategoria || 'General';
        const descripcion = p.comentarios || 'Sin descripción disponible.';

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/detalle_producto.css">
            <section class="detalle-contenedor" id="detalleProductoContenedor">
                <div class="detalle-imagen-box">
                    <img 
                        src="${imagenSrc}" 
                        alt="${p.nombre}" 
                        class="detalle-imagen"
                        id="imgDetalle-${p.idProducto}">
                </div>

                <div class="detalle-info" id="detalleInfo">
                    <h1 class="detalle-nombre" id="nombreDetalle">${p.nombre}</h1>
                    <p class="detalle-categoria"><strong>Categoría:</strong> ${categoriaNombre}</p>
                    <p class="detalle-descripcion">${descripcion}</p>
                    <div class="detalle-precio">$${precioUnitario}</div>
                </div>
            </section>
        `;

        const detalleInfo = this._root.getElementById('detalleInfo');

        if (this._soloVista) {
            const btnRegresarSolo = document.createElement('button');
            btnRegresarSolo.type = 'button';
            btnRegresarSolo.className = 'btn-regresar';
            btnRegresarSolo.textContent = 'Regresar';
            btnRegresarSolo.addEventListener('click', () => this._regresar());
            detalleInfo.appendChild(btnRegresarSolo);
            return;
        }

        // Controles de tamaño y cantidad
        const controlesDiv = document.createElement('div');
        controlesDiv.className = 'detalle-controles';

        // Grupo tamaños
        const grupoTamano = document.createElement('div');
        grupoTamano.className = 'control-grupo';
        grupoTamano.innerHTML = `<span class="control-label">Tamaño:</span>`;

        const opcionesTamano = document.createElement('div');
        opcionesTamano.className = 'tamanos-opciones';

        tamanos.forEach(tam => {
            const btnTam = document.createElement('button');
            btnTam.type = 'button';
            btnTam.className = `btn-tamano ${this._tamanoSeleccionado === tam ? 'activo' : ''}`;
            btnTam.id = `btnTam-${tam}`;
            btnTam.textContent = tam;
            btnTam.addEventListener('click', () => this._seleccionarTamano(tam));
            opcionesTamano.appendChild(btnTam);
        });

        grupoTamano.appendChild(opcionesTamano);

        // Grupo cantidad
        const grupoCantidad = document.createElement('div');
        grupoCantidad.className = 'control-grupo';
        grupoCantidad.innerHTML = `
            <span class="control-label">Cantidad:</span>
            <div class="contador-box">
                <button type="button" class="btn-cant" id="btnMenos">-</button>
                <span class="valor-cant" id="valorCantidad">${this._cantidad}</span>
                <button type="button" class="btn-cant" id="btnMas">+</button>
            </div>
        `;

        controlesDiv.appendChild(grupoTamano);
        controlesDiv.appendChild(grupoCantidad);
        detalleInfo.appendChild(controlesDiv);

        // Botones de acción (Agregar al carrito y Regresar)
        const accionesDiv = document.createElement('div');
        accionesDiv.className = 'detalle-acciones';
        accionesDiv.innerHTML = `
            <button type="button" class="btn-agregar-carrito" id="btnAgregarCarrito">
                Agregar al carrito ($${total})
            </button>
            <button type="button" class="btn-regresar" id="btnRegresar">
                Regresar
            </button>
        `;
        detalleInfo.appendChild(accionesDiv);

        // Listeners nativos
        this._root.getElementById('btnMenos').addEventListener('click', () => this._cambiarCantidad(-1));
        this._root.getElementById('btnMas').addEventListener('click', () => this._cambiarCantidad(1));
        this._root.getElementById('btnAgregarCarrito').addEventListener('click', () => this._agregarAlCarrito());
        this._root.getElementById('btnRegresar').addEventListener('click', () => this._regresar());
    }
}

customElements.define('detalle-producto', DetalleProducto);
export default DetalleProducto;