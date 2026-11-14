import '../tarjeta_simple.js';

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
        this._estructuraCreada = false;
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
        if (this._categoriaActivaId === idCategoria) return;
        this._categoriaActivaId = idCategoria;
        this._subcategoriaActiva = 'Todas';
        this._dibujar();
    }

    _cambiarSubcategoria(sub) {
        if (this._subcategoriaActiva === sub) return;
        this._subcategoriaActiva = sub;
        this._dibujar();
    }

    _obtenerProductosPorCategoria() {
        if (!this._categoriaActivaId) return this._productos;
        return this._productos.filter(p => p.idTipoProducto === this._categoriaActivaId);
    }

    _obtenerSubcategorias() {
        const prodsCat = this._obtenerProductosPorCategoria();
        const subs = new Set(
            prodsCat
                .map(p => (p.subcategoria || '').trim())
                .filter(s => s && s.toLowerCase() !== 'todas' && s.toLowerCase() !== 'todos')
        );
        return ['Todas', ...Array.from(subs)];
    }

    _obtenerProductosFiltrados() {
        const prodsCat = this._obtenerProductosPorCategoria();
        if (this._subcategoriaActiva === 'Todas') return prodsCat;
        return prodsCat.filter(p => (p.subcategoria || '').trim() === this._subcategoriaActiva);
    }

    _emitirSeleccionProducto(e, producto) {
        if (e) e.stopPropagation();
        this.dispatchEvent(new CustomEvent('seleccionar-producto', {
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

    _crearEstructuraBase() {
        if (this._estructuraCreada) return;
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/catalogo_productos.css">
            <div class="catalogo-layout" id="catalogoLayout">
                <aside class="sidebar-categorias" id="sidebarCategorias">
                    <h2 class="sidebar-titulo">Categorías</h2>
                    <ul class="sidebar-lista" id="listaSidebar"></ul>
                </aside>

                <main class="catalogo-principal" id="catalogoPrincipal">
                    <div class="barra-superior-catalogo" id="barraSuperior">
                        <div class="tabs-subcategorias" id="tabsSubcategorias"></div>
                        <div id="contenedorBtnGuardar"></div>
                    </div>
                    <div class="productos-grid" id="gridProductos"></div>
                </main>
            </div>
        `;
        this._estructuraCreada = true;
    }

    _dibujar() {
        this._crearEstructuraBase();

        const subcategorias = this._obtenerSubcategorias();
        const productosVisibles = this._obtenerProductosFiltrados();

        // 1. Actualizar solo la lista lateral sin recargar el CSS
        const listaSidebar = this._root.getElementById('listaSidebar');
        listaSidebar.innerHTML = '';
        this._categorias.forEach(cat => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `sidebar-btn ${cat.idTipoProducto === this._categoriaActivaId ? 'activa' : ''}`;
            btn.id = `btnCat-${cat.idTipoProducto}`;
            btn.textContent = cat.nombre;
            btn.addEventListener('click', () => this._cambiarCategoria(cat.idTipoProducto));
            li.appendChild(btn);
            listaSidebar.appendChild(li);
        });

        // 2. Actualizar las pestañas superiores (Todas + subcategorías reales de esa categoría)
        const tabsContainer = this._root.getElementById('tabsSubcategorias');
        tabsContainer.innerHTML = '';
        subcategorias.forEach(sub => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `tab-btn ${sub === this._subcategoriaActiva ? 'activa' : ''}`;
            btn.id = `tabSub-${sub}`;
            btn.textContent = sub;
            btn.addEventListener('click', () => this._cambiarSubcategoria(sub));
            tabsContainer.appendChild(btn);
        });

        // 3. Botón Guardar / Terminar Orden
        const contenedorGuardar = this._root.getElementById('contenedorBtnGuardar');
        contenedorGuardar.innerHTML = '';
        if (!this._modoLectura && this._cantidadCarrito > 0) {
            const btnGuardar = document.createElement('button');
            btnGuardar.type = 'button';
            btnGuardar.className = 'btn-guardar-orden';
            btnGuardar.id = 'btnGuardarOrden';
            btnGuardar.textContent = `Guardar (${this._cantidadCarrito})`;
            btnGuardar.addEventListener('click', () => this._emitirVerOrden());
            contenedorGuardar.appendChild(btnGuardar);
        }

        // 4. Actualizar tarjetas de productos
        const gridProductos = this._root.getElementById('gridProductos');
        gridProductos.innerHTML = '';

        if (productosVisibles.length === 0) {
            const vacio = document.createElement('p');
            vacio.className = 'estado-vacio';
            vacio.textContent = 'No hay productos en esta sección.';
            gridProductos.appendChild(vacio);
            return;
        }

        productosVisibles.forEach(prod => {
            const card = document.createElement('tarjeta-simple');
            card.id = `cardProd-${prod.idProducto}`;
            card.style.cursor = 'pointer';

            const precioFormateado = Number(prod.precioSugerido || 0).toFixed(2);
            const imagenSrc = prod.imagen || './resources/img/logo_cafe.png';

            card.innerHTML = `
                <div slot="titulo" class="prod-img-wrap">
                    <img src="${imagenSrc}" alt="${prod.nombre}" class="prod-img">
                </div>
                <div slot="contenido" class="prod-info">
                    <h3 class="prod-nombre">${prod.nombre}</h3>
                    <p class="prod-desc">${prod.comentarios || ''}</p>
                </div>
                <div slot="pie" class="prod-footer">
                    <span class="prod-precio">$${precioFormateado}</span>
                    ${!this._modoLectura ? `
                        <button type="button" class="btn-agregar-card" id="btnAdd-${prod.idProducto}">
                            Agregar
                        </button>
                    ` : ''}
                </div>
            `;

            card.addEventListener('click', (e) => this._emitirSeleccionProducto(e, prod));

            if (!this._modoLectura) {
                const btnAdd = card.querySelector(`#btnAdd-${prod.idProducto}`);
                btnAdd.addEventListener('click', (e) => this._emitirSeleccionProducto(e, prod));
            }

            gridProductos.appendChild(card);
        });
    }
}

customElements.define('catalogo-productos', CatalogoProductos);
export default CatalogoProductos;