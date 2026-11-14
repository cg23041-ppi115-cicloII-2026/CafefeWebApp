class DetalleProducto extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
        this._producto = null;
        this._gruposCaracteristicas = [];
        this._selecciones = {};
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
        this._dibujar();
    }

    get producto() {
        return this._producto;
    }

    set gruposCaracteristicas(grupos) {
        this._gruposCaracteristicas = Array.isArray(grupos) ? grupos : [];
        this._selecciones = {};
        this._gruposCaracteristicas.forEach(grupo => {
            if (grupo.opciones && grupo.opciones.length > 0) {
                this._selecciones[grupo.nombre] = grupo.opciones[0].etiqueta;
            }
        });
        this._dibujar();
    }

    get gruposCaracteristicas() {
        return this._gruposCaracteristicas;
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

    _calcularTotal() {
        if (!this._producto) return 0;
        return Number(this._producto.precioSugerido || 0) * this._cantidad;
    }

    _construirResumenPersonalizacion() {
        const entradas = Object.entries(this._selecciones);
        if (entradas.length === 0) return 'Estándar';
        return entradas.map(([grupo, valor]) => `${grupo}: ${valor}`).join(' | ');
    }

    _agregarAlCarrito() {
        if (!this._producto) return;
        this.dispatchEvent(new CustomEvent('agregar-carrito', {
            detail: {
                producto: this._producto,
                personalizacion: this._construirResumenPersonalizacion(),
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
        const total = this._calcularTotal().toFixed(2);
        const tieneDesc = p.tieneDescuento === true && Number(p.precioOriginal) > Number(p.precioSugerido);
        const precioUnitario = Number(p.precioSugerido || 0).toFixed(2);
        const precioOriginal = Number(p.precioOriginal || 0).toFixed(2);
        const imagenSrc = p.imagen || './resources/img/logo_cafe.png';
        const categoriaNombre = p.nombreTipoProducto || p.subcategoria || 'General';
        const descripcion = p.comentarios || 'Sin descripción disponible.';

        const bannerPromoHtml = tieneDesc
            ? `
                <div class="detalle-promo-badge">
                    Promoción aplicada: <strong>${p.nombreDescuento || 'Descuento'}</strong> (-${p.porcentajeDescuento}%)
                </div>
            `
            : '';

        const bloquePrecioHtml = tieneDesc
            ? `
                <div class="detalle-precio">
                    <span class="detalle-precio-original">$${precioOriginal}</span>
                    <span class="detalle-precio-promo">$${precioUnitario}</span>
                </div>
            `
            : `<div class="detalle-precio">$${precioUnitario}</div>`;

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/detalle_producto.css">
            <style>
                .detalle-promo-badge {
                    display: inline-block;
                    background: var(--color-acento, #C8322B);
                    color: var(--texto-claro, #FFFFFF);
                    padding: 0.35rem 0.85rem;
                    border-radius: 999px;
                    font-size: 0.85rem;
                    margin-bottom: 0.65rem;
                }
                .detalle-precio-original {
                    font-size: 1.05rem;
                    color: var(--texto-secundario, #6e5740);
                    text-decoration: line-through;
                    margin-right: 0.6rem;
                    font-weight: 500;
                }
                .detalle-precio-promo {
                    color: var(--color-acento, #C8322B);
                }
            </style>
            <section class="detalle-contenedor" id="detalleProductoContenedor">
                <div class="detalle-imagen-box">
                    <img 
                        src="${imagenSrc}" 
                        alt="${p.nombre}" 
                        class="detalle-imagen"
                        id="imgDetalle-${p.idProducto}">
                </div>

                <div class="detalle-info" id="detalleInfo">
                    ${bannerPromoHtml}
                    <h1 class="detalle-nombre" id="nombreDetalle">${p.nombre}</h1>
                    <p class="detalle-categoria"><strong>Categoría:</strong> ${categoriaNombre}</p>
                    <p class="detalle-descripcion">${descripcion}</p>
                    ${bloquePrecioHtml}
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

        const controlesDiv = document.createElement('div');
        controlesDiv.className = 'detalle-controles';

        this._gruposCaracteristicas.forEach((grupo, index) => {
            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'control-grupo';

            const label = document.createElement('label');
            label.className = 'control-label';
            label.setAttribute('for', `selectCar-${index}`);
            label.textContent = `${grupo.nombre}:`;

            const select = document.createElement('select');
            select.id = `selectCar-${index}`;
            select.className = 'select-caracteristica';
            select.style.cssText = 'padding: 0.55rem 0.9rem; border: 2px solid #4B3621; border-radius: 10px; background: #FFFFFF; color: #4B3621; font-weight: 600; font-size: 0.95rem; min-width: 190px; cursor: pointer;';

            grupo.opciones.forEach(op => {
                const option = document.createElement('option');
                option.value = op.etiqueta;
                option.textContent = op.etiqueta;
                if (this._selecciones[grupo.nombre] === op.etiqueta) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            select.addEventListener('change', (e) => {
                this._selecciones[grupo.nombre] = e.target.value;
            });

            grupoDiv.appendChild(label);
            grupoDiv.appendChild(select);
            controlesDiv.appendChild(grupoDiv);
        });

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
        controlesDiv.appendChild(grupoCantidad);
        detalleInfo.appendChild(controlesDiv);

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

        this._root.getElementById('btnMenos').addEventListener('click', () => this._cambiarCantidad(-1));
        this._root.getElementById('btnMas').addEventListener('click', () => this._cambiarCantidad(1));
        this._root.getElementById('btnAgregarCarrito').addEventListener('click', () => this._agregarAlCarrito());
        this._root.getElementById('btnRegresar').addEventListener('click', () => this._regresar());
    }
}

customElements.define('detalle-producto', DetalleProducto);
export default DetalleProducto;