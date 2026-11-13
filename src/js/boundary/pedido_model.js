import { html, render } from '../lib/lit-html.js';

// Tus 4 Web Components de la vista (carpeta ./componentes/)
import './components/grid_categorias.js';
import './components/catalogo_productos.js';
import './components/detalle_producto.js';
import './components/resumen_orden.js';
// DAOs de la capa control/
import TipoProductoDAO from '../control/tipo_producto_dao.js';
import ProductoDAO from '../control/producto_dao.js';
import ProductoTipoProductoDAO from '../control/producto_tipo_producto_dao.js';
import OrdenDAO from '../control/orden_dao.js';
import OrdenProductoDAO from '../control/orden_producto_dao.js';

// Entidades de la capa entity/
import Orden from '../entity/orden.js';
import OrdenProducto from '../entity/orden_producto.js';

class PedidoModel extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });

        // Instancias de tus DAOs
        this.tipoProductoDAO = new TipoProductoDAO();
        this.productoDAO = new ProductoDAO();
        this.productoTipoProductoDAO = new ProductoTipoProductoDAO();
        this.ordenDAO = new OrdenDAO();
        this.ordenProductoDAO = new OrdenProductoDAO();

        // Estado interno del flujo de 4 pasos
        this.pasoActual = 1; // 1: Categorías, 2: Catálogo, 3: Detalle, 4: Resumen
        this.categorias = [];
        this.productos = [];
        this.categoriaSeleccionadaId = null;
        this.productoSeleccionado = null;
        this.carrito = [];
        this.cargando = true;
    }

    async connectedCallback() {
        this._dibujar();
        await this._cargarDatosDesdeAPI();
    }

    async _cargarDatosDesdeAPI() {
        try {
            // Consultamos en paralelo categorías, productos y su relación muchos-a-muchos
        const [respCategorias, respProductos, respRelaciones] = await Promise.all([
    this.tipoProductoDAO.findRange(0, 50),
    this.productoDAO.findRange(0, 50),
    this.productoTipoProductoDAO.findRange(0, 50)
]);

            const listaCategorias = respCategorias.datos || [];
            const listaProductos = respProductos.datos || [];
            const listaRelaciones = respRelaciones.datos || [];

            // Filtramos solo categorías activas y asignamos ruta de imagen
            this.categorias = listaCategorias
                .filter(cat => cat.activo !== false)
                .map(cat => ({
                    ...cat,
                    imagen: cat.imagen || `./resources/img/categorias/${cat.idTipoProducto}.png`
                }));

            // Cruzamos cada producto activo con su idTipoProducto de producto_tipo_producto
            this.productos = listaProductos
                .filter(prod => prod.activo !== false)
                .map(prod => {
                    const rel = listaRelaciones.find(r => r.idProducto === prod.idProducto);
                    const cat = this.categorias.find(c => c.idTipoProducto === rel?.idTipoProducto);

                    return {
                        ...prod,
                        idTipoProducto: rel ? rel.idTipoProducto : null,
                        nombreTipoProducto: cat ? cat.nombre : 'General',
                        subcategoria: prod.subcategoria || 'Todos',
                        tamanos: prod.tamanos || ['S', 'M', 'L'],
                        imagen: prod.imagen || `./resources/img/productos/${prod.idProducto}.png`
                    };
                });
        } catch (err) {
            console.error('Error al cargar el catálogo de Cafefe:', err);
        } finally {
            this.cargando = false;
            this._dibujar();
        }
    }

    _totalItemsCarrito() {
        return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    }

    _agregarAlCarrito(producto, tamano = 'M', cantidad = 1) {
        const existente = this.carrito.find(
            item => item.idProducto === producto.idProducto && item.tamano === tamano
        );

        if (existente) {
            existente.cantidad += cantidad;
        } else {
            this.carrito = [
                ...this.carrito,
                {
                    idProducto: producto.idProducto,
                    nombre: producto.nombre,
                    imagen: producto.imagen,
                    precio: Number(producto.precioSugerido || 0),
                    tamano,
                    cantidad
                }
            ];
        }
        this._dibujar();
    }

    _actualizarCantidadCarrito(index, delta) {
        const copia = [...this.carrito];
        copia[index].cantidad += delta;
        if (copia[index].cantidad <= 0) {
            copia.splice(index, 1);
        }
        this.carrito = copia;
        this._dibujar();
    }

    async _confirmarYEnviarOrden({ items }) {
        try {
            // 1. Creamos la cabecera en la tabla 'orden' (sin factura ni pago, pendiente en local)
            const nuevaOrden = new Orden({
                fechaCreacion: new Date().toISOString()
            });

            const respOrden = await this.ordenDAO.create(nuevaOrden);
            const ordenCreada = respOrden.datos || respOrden;
            const idOrdenGenerado = ordenCreada.idOrden;

            // 2. Guardamos cada ítem en 'orden_producto' vinculado al idOrden generado
            const promesasDetalles = [];
            items.forEach(item => {
                // Como orden_producto no tiene columna 'cantidad', insertamos 1 fila por unidad
                for (let i = 0; i < item.cantidad; i++) {
                    const detalle = new OrdenProducto({
                        idOrden: idOrdenGenerado,
                        idProducto: item.idProducto,
                        precio: item.precio,
                        observaciones: `Tamaño: ${item.tamano}`
                    });
                    promesasDetalles.push(this.ordenProductoDAO.create(detalle));
                }
            });

            await Promise.all(promesasDetalles);

            alert('¡Tu orden ha sido enviada como pendiente! Puedes pasar a pagar y recoger en el local.');
            this.carrito = [];
            this.pasoActual = 1;
            this._dibujar();
        } catch (err) {
            console.error('Error al registrar la orden pendiente:', err);
            alert('No se pudo registrar la orden. Revisa la conexión con el servidor.');
        }
    }

    _renderPaso() {
        if (this.cargando) {
            return html`<p style="text-align:center; padding:3rem; color:#4B3621;">Cargando menú de Cafefe...</p>`;
        }

        switch (this.pasoActual) {
            case 1:
                return html`
                    <grid-categorias
                        .categorias=${this.categorias}
                        @categoria-seleccionada=${(e) => {
                            this.categoriaSeleccionadaId = e.detail.idTipoProducto;
                            this.pasoActual = 2;
                            this._dibujar();
                        }}>
                    </grid-categorias>
                `;

            case 2:
                return html`
                    <catalogo-productos
                        .categorias=${this.categorias}
                        .productos=${this.productos}
                        .categoriaActivaId=${this.categoriaSeleccionadaId}
                        .cantidadCarrito=${this._totalItemsCarrito()}
                        @seleccionar-producto=${(e) => {
                            this.productoSeleccionado = e.detail;
                            this.pasoActual = 3;
                            this._dibujar();
                        }}
                        @agregar-rapido=${(e) => {
                            this._agregarAlCarrito(e.detail, 'M', 1);
                        }}
                        @ver-orden=${() => {
                            this.pasoActual = 4;
                            this._dibujar();
                        }}>
                    </catalogo-productos>
                `;

            case 3:
                return html`
                    <detalle-producto
                        .producto=${this.productoSeleccionado}
                        @agregar-carrito=${(e) => {
                            const { producto, tamano, cantidad } = e.detail;
                            this._agregarAlCarrito(producto, tamano, cantidad);
                            this.pasoActual = 2;
                            this._dibujar();
                        }}
                        @regresar=${() => {
                            this.pasoActual = 2;
                            this._dibujar();
                        }}>
                    </detalle-producto>
                `;

            case 4:
                return html`
                    <resumen-orden
                        .items=${this.carrito}
                        @actualizar-cantidad=${(e) => {
                            this._actualizarCantidadCarrito(e.detail.index, e.detail.delta);
                        }}
                        @seguir-pidiendo=${() => {
                            this.pasoActual = 2;
                            this._dibujar();
                        }}
                        @confirmar-orden=${(e) => this._confirmarYEnviarOrden(e.detail)}>
                    </resumen-orden>
                `;
        }
    }

    _template() {
        return html`
            ${this._renderPaso()}
        `;
    }

    _dibujar() {
        render(this._template(), this.root);
    }
}

customElements.define('pedido-model', PedidoModel);
export default PedidoModel;