import OrdenDAO from "../control/orden_dao.js";
import OrdenProductoDAO from "../control/orden_producto_dao.js";
import ProductoDAO from "../control/producto_dao.js";
import "./components/orden/tarjeta_orden.js";
import "./components/orden/orden_proceso.js";
import "./components/mensaje_error.js";

class OrdenModel extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._ordenDAO = new OrdenDAO();
        this._productoDAO = new ProductoDAO();
        this._mapaProductos = new Map();

        this._pagina = 0;
        this._tamanoPagina = 5;

        this._pendientes = [];
        this._enProceso = null; // { orden, productos }
        this._listas = [];
    }

    connectedCallback() {
        this._dibujarLayout();
        this._cargarCatalogoProductos()
            .finally(() => this._cargarOrdenes());
    }

    _mostrarError(titulo, err, accionReintentar = null) {
        const zona = this._root.querySelector("#zonaErrores");
        zona.innerHTML = "";

        const alerta = document.createElement("mensaje-error");
        alerta.titulo = titulo;
        alerta.error = err;
        alerta.reintentable = typeof accionReintentar === "function";

        if (accionReintentar) {
            alerta.addEventListener("reintentar-operacion", () => {
                this._limpiarError();
                accionReintentar();
            });
        }

        zona.appendChild(alerta);
    }

    _limpiarError() {
        const zona = this._root.querySelector("#zonaErrores");
        if (zona) zona.innerHTML = "";
    }

    _cargarCatalogoProductos() {
        return this._productoDAO.findRange(0, 200)
            .then(res => {
                const lista = Array.isArray(res.datos) ? res.datos : [];
                this._mapaProductos.clear();
                lista.forEach(prod => {
                    this._mapaProductos.set(String(prod.idProducto), prod.nombre);
                });
            })
            .catch(err => {
                this._mostrarError(
                    "Advertencia: Catálogo de productos no disponible",
                    err,
                    () => this._cargarCatalogoProductos()
                );
            });
    }

    _cargarOrdenes() {
        const first = this._pagina * this._tamanoPagina;
        this._ordenDAO.findRange(first, this._tamanoPagina)
            .then(res => {
                this._limpiarError();
                const datos = Array.isArray(res.datos) ? res.datos : [];
                const idActivo = this._enProceso?.orden?.idOrden;
                const idsListos = new Set(this._listas.map(o => o.idOrden));

                this._pendientes = datos.filter(o => o.idOrden !== idActivo && !idsListos.has(o.idOrden));
                this._renderizarListas();
            })
            .catch(err => {
                this._mostrarError(
                    "No se pudo cargar la cola de órdenes",
                    err,
                    () => this._cargarOrdenes()
                );
            });
    }

    _tomarOrden(orden) {
        if (this._enProceso) {
            this._mostrarError(
                "Estación ocupada",
                "Ya tienes un pedido en preparación. Complétalo o devuélvelo a la cola antes de tomar otro."
            );
            return;
        }

        const prodDAO = new OrdenProductoDAO(orden.idOrden);
        prodDAO.findRange(0, 50)
            .then(res => {
                this._limpiarError();
                const itemsCrudos = Array.isArray(res.datos) ? res.datos : [];

                if (itemsCrudos.length === 0) {
                    this._mostrarError(
                        "Orden sin productos",
                        `La orden #${String(orden.idOrden).slice(-5).toUpperCase()} no tiene productos registrados.`
                    );
                    return;
                }

                const productos = itemsCrudos.map(item => ({
                    ...item,
                    nombreProducto: this._mapaProductos.get(String(item.idProducto)) || `Producto #${item.idProducto}`,
                    listo: false
                }));

                this._pendientes = this._pendientes.filter(o => o.idOrden !== orden.idOrden);
                this._enProceso = { orden, productos };
                this._renderizarListas();
            })
            .catch(err => {
                this._mostrarError(
                    "Error al obtener los productos del pedido",
                    err,
                    () => this._tomarOrden(orden)
                );
            });
    }

    _devolverOrden(orden) {
        this._limpiarError();
        this._pendientes.unshift(orden);
        this._enProceso = null;
        this._renderizarListas();
    }

    _completarOrden(orden) {
        this._limpiarError();
        this._listas.unshift(orden);
        this._enProceso = null;
        this._renderizarListas();
    }

    _entregarOrden(orden) {
        this._limpiarError();
        this._listas = this._listas.filter(o => o.idOrden !== orden.idOrden);
        this._renderizarListas();
    }

    _dibujarLayout() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/orden_model.css">

            <header class="navbar">
                <img src="./resources/img/logo_cafe.png" alt="Logo Cafefe" class="navbar-logo">
                <h1>Cafefe · Pantalla de Cocina y Barista</h1>
                <button type="button" class="btn-refrescar" id="btnRefrescar">Actualizar Cola</button>
            </header>

            <div class="zona-errores" id="zonaErrores"></div>

            <main class="tablero">
                <section class="columna">
                    <h2>1. En Cola (Pendientes)</h2>
                    <div class="lista-tarjetas" id="contenedorPendientes"></div>
                    <div class="paginacion">
                        <button type="button" id="btnAnterior">← Anterior</button>
                        <span class="indicador-pagina" id="indicadorPagina">Pág. 1</span>
                        <button type="button" id="btnSiguiente">Siguiente →</button>
                    </div>
                </section>

                <section class="columna">
                    <h2>2. En Proceso</h2>
                    <orden-proceso id="visorProceso"></orden-proceso>
                </section>

                <section class="columna">
                    <h2>3. Listos para Recoger</h2>
                    <div class="lista-tarjetas" id="contenedorListas"></div>
                </section>
            </main>
        `;

        this._root.querySelector("#btnRefrescar").addEventListener("click", () => this._cargarOrdenes());
        this._root.querySelector("#btnAnterior").addEventListener("click", () => {
            if (this._pagina > 0) {
                this._pagina--;
                this._cargarOrdenes();
            }
        });
        this._root.querySelector("#btnSiguiente").addEventListener("click", () => {
            if (this._pendientes.length === this._tamanoPagina) {
                this._pagina++;
                this._cargarOrdenes();
            }
        });

        this._root.addEventListener("tomar-orden", e => this._tomarOrden(e.detail));
        this._root.addEventListener("devolver-orden", e => this._devolverOrden(e.detail));
        this._root.addEventListener("orden-completada", e => this._completarOrden(e.detail));
        this._root.addEventListener("entregar-orden", e => this._entregarOrden(e.detail));
    }

    _renderizarListas() {
        const contPendientes = this._root.querySelector("#contenedorPendientes");
        const contListas = this._root.querySelector("#contenedorListas");
        const visorProceso = this._root.querySelector("#visorProceso");

        contPendientes.innerHTML = "";
        if (this._pendientes.length === 0) {
            contPendientes.innerHTML = `<p class="texto-vacio">No hay pedidos pendientes en esta página.</p>`;
        } else {
            this._pendientes.forEach(orden => {
                const card = document.createElement("tarjeta-orden");
                card.modo = "pendiente";
                card.datos = orden;
                contPendientes.appendChild(card);
            });
        }

        visorProceso.ordenActual = this._enProceso || { orden: null, productos: [] };

        contListas.innerHTML = "";
        if (this._listas.length === 0) {
            contListas.innerHTML = `<p class="texto-vacio">Aún no hay pedidos listos para entregar.</p>`;
        } else {
            this._listas.forEach(orden => {
                const card = document.createElement("tarjeta-orden");
                card.modo = "lista";
                card.datos = orden;
                contListas.appendChild(card);
            });
        }

        this._root.querySelector("#indicadorPagina").textContent = `Pág. ${this._pagina + 1}`;
        this._root.querySelector("#btnAnterior").disabled = this._pagina === 0;
        this._root.querySelector("#btnSiguiente").disabled = this._pendientes.length < this._tamanoPagina;
    }
}

customElements.define("orden-model", OrdenModel);
export default OrdenModel;