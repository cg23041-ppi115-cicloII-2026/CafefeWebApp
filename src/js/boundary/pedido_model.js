import './components/cafefe_navbar.js';
import './components/pedido/grid_categorias.js';
import './components/pedido/catalogo_productos.js';
import './components/pedido/detalle_producto.js';
import './components/pedido/resumen_orden.js';
import './components/mensaje_error.js';
import SessionManager from '../control/session_manager.js';
import TipoProductoDAO from '../control/tipo_producto_dao.js';
import ProductoDAO from '../control/producto_dao.js';
import ProductoTipoProductoDAO from '../control/producto_tipo_producto_dao.js';
import CaracteristicaDAO from '../control/caracteristica_dao.js';
import TipoCaracteristicaDAO from '../control/tipo_caracteristica_dao.js';
import ProductoCaracteristicaDAO from '../control/producto_caracteristica_dao.js';
import TipoDescuentoDAO from '../control/tipo_descuento_dao.js';
import DescuentoDAO from '../control/descuento_dao.js';
import DescuentoProductoDAO from '../control/descuento_producto_dao.js';
import OrdenDAO from '../control/orden_dao.js';
import OrdenProductoDAO from '../control/orden_producto_dao.js';
import Orden from '../entity/orden.js';

function normalizarNombreImagen(texto = '') {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .replace(/\s+/g, '_');
}

function resolverRutaImagen(nombre, carpeta = '') {
    const slug = normalizarNombreImagen(nombre);
    if (!slug) return './resources/img/logo_cafe.png';
    const prefijo = carpeta ? `${carpeta}/` : '';
    return `./resources/img/${prefijo}${slug}.png`;
}

class PedidoModel extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.sessionManager = new SessionManager();
        this.tipoProductoDAO = new TipoProductoDAO();
        this.productoDAO = new ProductoDAO();
        this.caracteristicaDAO = new CaracteristicaDAO();
        this.tipoCaracteristicaDAO = new TipoCaracteristicaDAO();
        this.tipoDescuentoDAO = new TipoDescuentoDAO();
        this.descuentoDAO = new DescuentoDAO();
        this.ordenDAO = new OrdenDAO();
        this.pasoActual = 1;
        this.categorias = [];
        this.productos = [];
        this.caracteristicas = [];
        this.tiposCaracteristica = [];
        this.gruposCaracteristicasProducto = [];
        this.idCategoriaDescuentos = null;
        this.categoriaSeleccionadaId = null;
        this.productoSeleccionado = null;
        this.carrito = [];
        this.cargando = true;
        this._enviandoOrden = false;
        this._ordenConfirmadaId = null;
        this._clienteConfirmado = '';
    }

    async connectedCallback() {
        this._configurarSesionNavbar();
        this._dibujar();
        await this._cargarDatosDesdeAPI();
    }

    _configurarSesionNavbar() {
        const sesion = this.sessionManager.obtenerSesion();
        const navbar = document.querySelector('cafefe-navbar');
        if (navbar) {
            navbar.setAttribute('redirect-logout', './login.html');
            if (sesion && sesion.modo === 'EMPLEADO') {
                navbar.setAttribute('usuario', `${sesion.nombre} · ${sesion.vistaInicial}`);
                navbar.removeAttribute('ocultar-cerrar-sesion');
            } else {
                navbar.removeAttribute('usuario');
                navbar.setAttribute('ocultar-cerrar-sesion', '');
            }
        }
        if (!this._listenerLogoutRegistrado) {
            this._listenerLogoutRegistrado = true;
            document.addEventListener('cerrar-sesion', () => {
                this.sessionManager.cerrarSesion();
                window.location.replace('./login.html');
            });
        }
    }

    _mostrarError(titulo, err, accionReintentar = null) {
        const zona = this.root.querySelector('#zonaErrores');
        if (!zona) return;
        zona.innerHTML = '';
        const alerta = document.createElement('mensaje-error');
        alerta.titulo = titulo;
        alerta.error = err;
        alerta.reintentable = typeof accionReintentar === 'function';
        if (accionReintentar) {
            alerta.addEventListener('reintentar-operacion', () => {
                this._limpiarError();
                accionReintentar();
            });
        }
        zona.appendChild(alerta);
    }

    _limpiarError() {
        const zona = this.root.querySelector('#zonaErrores');
        if (zona) zona.innerHTML = '';
    }

    _estaVigente(fechaDesde, fechaHasta, ahora = new Date()) {
        if (fechaDesde) {
            const inicio = new Date(fechaDesde);
            if (!Number.isNaN(inicio.getTime()) && ahora < inicio) return false;
        }
        if (fechaHasta) {
            const fin = new Date(fechaHasta);
            if (!Number.isNaN(fin.getTime()) && ahora > fin) return false;
        }
        return true;
    }

    async _cargarMapaDescuentosVigentes() {
        const mapaPorProducto = new Map();
        const ahora = new Date();
        try {
            const [respTipos, respDescuentos] = await Promise.all([
                this.tipoDescuentoDAO.findRange(0, 50),
                this.descuentoDAO.findRange(0, 50)
            ]);
            const tiposActivos = new Map();
            (respTipos.datos || []).forEach(td => {
                if (td.activo !== false && td.idTipoDescuento) {
                    tiposActivos.set(td.idTipoDescuento, td);
                }
            });
            const descuentosVigentes = (respDescuentos.datos || []).filter(desc => {
                const idTipo = desc.idTipoDescuento?.idTipoDescuento
                    || (typeof desc.idTipoDescuento === 'string' ? desc.idTipoDescuento : null);
                if (idTipo && tiposActivos.size > 0 && !tiposActivos.has(idTipo)) {
                    return false;
                }
                return this._estaVigente(desc.fechaDesde, desc.fechaHasta, ahora);
            });
            await Promise.all(
                descuentosVigentes.map(async (desc) => {
                    try {
                        const dpDAO = new DescuentoProductoDAO(desc.idDescuento);
                        const respDP = await dpDAO.findRange(0, 50);
                        const itemsDP = respDP.datos || [];
                        const idTipo = desc.idTipoDescuento?.idTipoDescuento
                            || (typeof desc.idTipoDescuento === 'string' ? desc.idTipoDescuento : null);
                        const tipoInfo = idTipo ? tiposActivos.get(idTipo) : null;
                        const maxPermitido = Number(tipoInfo?.descuentoMaximo || 100);
                        itemsDP.forEach(dp => {
                            if (!this._estaVigente(dp.fechaDesde, dp.fechaHasta, ahora)) return;
                            const idProd = dp.idProducto?.idProducto
                                || (typeof dp.idProducto === 'string' ? dp.idProducto : null);
                            if (!idProd) return;
                            const valorCrudo = Number(dp.valor || 0);
                            const porcentaje = Math.max(0, Math.min(valorCrudo, maxPermitido));
                            if (porcentaje <= 0) return;
                            const anterior = mapaPorProducto.get(idProd);
                            if (!anterior || porcentaje > anterior.porcentaje) {
                                mapaPorProducto.set(idProd, {
                                    idDescuento: desc.idDescuento,
                                    nombreDescuento: desc.nombre || 'Promoción',
                                    tipoDescuento: tipoInfo?.nombre || '',
                                    porcentaje,
                                    observaciones: dp.observaciones || desc.observaciones || ''
                                });
                            }
                        });
                    } catch (e) {
                        console.warn(`No se pudieron cargar productos del descuento ${desc.nombre}:`, e);
                    }
                })
            );
        } catch (err) {
            console.warn('No se pudieron cargar descuentos desde Cafefe-api:', err);
        }
        return mapaPorProducto;
    }

    async _cargarDatosDesdeAPI() {
        this.cargando = true;
        this._dibujar();
        try {
            const [respCategorias, respProductos, respCar, respTipoCar, mapaDescuentos] = await Promise.all([
                this.tipoProductoDAO.findRange(0, 50),
                this.productoDAO.findRange(0, 50),
                this.caracteristicaDAO.findRange(0, 50),
                this.tipoCaracteristicaDAO.findRange(0, 50),
                this._cargarMapaDescuentosVigentes()
            ]);
            this._limpiarError();

            const categoriasRaw = (respCategorias.datos || []).filter(cat => cat.activo !== false);
            const listaProductos = (respProductos.datos || []).filter(p => p.activo !== false);
            this.caracteristicas = (respCar.datos || []).filter(c => c.activo !== false);
            this.tiposCaracteristica = (respTipoCar.datos || []).filter(tc => tc.activo !== false);

            // Detectar si existe una categoría real de Descuentos en la BD (sin crear virtuales)
            const catDescuentosBD = categoriasRaw.find(
                c => c.nombre.trim().toLowerCase().includes('descuento')
            );
            this.idCategoriaDescuentos = catDescuentosBD ? catDescuentosBD.idTipoProducto : null;

            const catBebidasMaestra = categoriasRaw.find(
                c => c.nombre.trim().toLowerCase() === 'bebidas' || c.nombre.trim().toLowerCase() === 'bebida'
            );
            const mapaRedireccionBebidas = new Map();
            categoriasRaw.forEach(c => {
                const nom = c.nombre.trim().toLowerCase();
                if (catBebidasMaestra && c.idTipoProducto !== catBebidasMaestra.idTipoProducto && nom.includes('bebida')) {
                    mapaRedireccionBebidas.set(c.idTipoProducto, {
                        idPrincipal: catBebidasMaestra.idTipoProducto,
                        subcategoria: c.nombre.trim()
                    });
                }
            });

            // Solo usar las categorías reales que vienen de la base de datos
            this.categorias = categoriasRaw
                .filter(cat => !mapaRedireccionBebidas.has(cat.idTipoProducto))
                .map(cat => {
                    const nombreFinal = cat.idTipoProducto === catBebidasMaestra?.idTipoProducto
                        ? 'Bebidas'
                        : cat.nombre;
                    return {
                        ...cat,
                        nombre: nombreFinal,
                        imagen: cat.imagen || resolverRutaImagen(nombreFinal, 'categorias')
                    };
                });

            const productosEnriquecidos = await Promise.all(
                listaProductos.map(async (prod) => {
                    let idTipoProducto = null;
                    let nombreTipoProducto = 'General';
                    let subcategoria = null;
                    try {
                        const ptpDAO = new ProductoTipoProductoDAO(prod.idProducto);
                        const respRel = await ptpDAO.findRange(0, 50);
                        const relaciones = respRel.datos || [];
                        const relValida = relaciones.find(r => {
                            const idC = r.idTipoProducto?.idTipoProducto
                                || r.tipoProducto?.idTipoProducto
                                || (typeof r.idTipoProducto === 'string' ? r.idTipoProducto : null);
                            return Boolean(idC);
                        });
                        if (relValida) {
                            let idCat =
                                relValida.idTipoProducto?.idTipoProducto ||
                                relValida.tipoProducto?.idTipoProducto ||
                                (typeof relValida.idTipoProducto === 'string' ? relValida.idTipoProducto : null);
                            subcategoria = relValida.observaciones || null;
                            if (mapaRedireccionBebidas.has(idCat)) {
                                const info = mapaRedireccionBebidas.get(idCat);
                                idCat = info.idPrincipal;
                                if (!subcategoria) {
                                    subcategoria = info.subcategoria;
                                }
                            }
                            idTipoProducto = idCat;
                            const catEncontrada = this.categorias.find(c => c.idTipoProducto === idTipoProducto);
                            if (catEncontrada) {
                                nombreTipoProducto = catEncontrada.nombre;
                            }
                        }
                    } catch (e) {
                        console.warn(`Sin categoría asociada para producto ${prod.nombre}:`, e);
                    }
                    const infoDesc = mapaDescuentos.get(prod.idProducto) || null;
                    const precioBase = Number(prod.precioSugerido || 0);
                    const precioFinal = infoDesc
                        ? Number((precioBase * (1 - infoDesc.porcentaje / 100)).toFixed(2))
                        : precioBase;
                    return {
                        ...prod,
                        idTipoProducto,
                        nombreTipoProducto,
                        subcategoria: subcategoria || 'Todos',
                        imagen: prod.imagen || resolverRutaImagen(prod.nombre),
                        precioOriginal: precioBase,
                        precioSugerido: precioFinal,
                        tieneDescuento: Boolean(infoDesc),
                        nombreDescuento: infoDesc?.nombreDescuento || null,
                        porcentajeDescuento: infoDesc?.porcentaje || 0
                    };
                })
            );
            this.productos = productosEnriquecidos;
        } catch (err) {
            console.error('Error al cargar menú desde Cafefe-api:', err);
            this._mostrarError(
                'No se pudo cargar el menú',
                err,
                () => this._cargarDatosDesdeAPI()
            );
        } finally {
            this.cargando = false;
            this._dibujar();
        }
    }

    async _abrirDetalleProducto(producto) {
        this._limpiarError();
        this.productoSeleccionado = producto;
        this.gruposCaracteristicasProducto = [];
        this.pasoActual = 3;
        this._dibujar();
        try {
            const pcDAO = new ProductoCaracteristicaDAO(producto.idProducto);
            const resp = await pcDAO.findRange(0, 50);
            const asignadas = resp.datos || [];
            const mapaGrupos = new Map();
            asignadas.forEach(item => {
                const idCar =
                    (typeof item.idCaracteristica === 'string' ? item.idCaracteristica : null) ||
                    item.idCaracteristica?.idCaracteristica ||
                    item.caracteristica?.idCaracteristica ||
                    item.id ||
                    null;
                const carInfo = this.caracteristicas.find(c => c.idCaracteristica === idCar)
                    || (typeof item.idCaracteristica === 'object' ? item.idCaracteristica : null)
                    || item.caracteristica
                    || item
                    || {};
                const idTipoCar =
                    (typeof carInfo.idTipoCaracteristica === 'string' ? carInfo.idTipoCaracteristica : null) ||
                    carInfo.idTipoCaracteristica?.idTipoCaracteristica ||
                    carInfo.tipoCaracteristica?.idTipoCaracteristica ||
                    'general';
                const tipoCarInfo = this.tiposCaracteristica.find(tc => tc.idTipoCaracteristica === idTipoCar)
                    || (typeof carInfo.idTipoCaracteristica === 'object' ? carInfo.idTipoCaracteristica : null)
                    || carInfo.tipoCaracteristica
                    || {};
                const nombreGrupo = tipoCarInfo.nombre || 'Opciones';
                const nombreOpcion = carInfo.nombre || item.valor || 'Opción';
                const etiquetaOpcion = item.valor && item.valor !== nombreOpcion
                    ? `${nombreOpcion} (${item.valor})`
                    : nombreOpcion;
                if (!mapaGrupos.has(idTipoCar)) {
                    mapaGrupos.set(idTipoCar, {
                        idTipoCaracteristica: idTipoCar,
                        nombre: nombreGrupo,
                        opciones: []
                    });
                }
                mapaGrupos.get(idTipoCar).opciones.push({
                    idProductoCaracteristica: item.idProductoCaracteristica || idCar,
                    idCaracteristica: idCar,
                    etiqueta: etiquetaOpcion,
                    valor: item.valor || nombreOpcion
                });
            });
            this.gruposCaracteristicasProducto = Array.from(mapaGrupos.values());
            this._dibujar();
        } catch (err) {
            console.warn('No se pudieron cargar características del producto:', err);
            this.gruposCaracteristicasProducto = [];
            this._dibujar();
        }
    }

    _totalItemsCarrito() {
        return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
    }

    _agregarAlCarrito(producto, personalizacion = 'Estándar', cantidad = 1) {
        const existente = this.carrito.find(
            item => item.idProducto === producto.idProducto && item.personalizacion === personalizacion
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
                    precioOriginal: Number(producto.precioOriginal || producto.precioSugerido || 0),
                    nombreDescuento: producto.nombreDescuento || null,
                    personalizacion,
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

    async _obtenerIdEmpleadoRolPorDefecto() {
        const sesion = this.sessionManager.obtenerSesion();
        if (sesion && sesion.modo === 'EMPLEADO' && sesion.idEmpleadoRolPrincipal) {
            return sesion.idEmpleadoRolPrincipal;
        }
        const base = this.ordenDAO.URL.replace(/orden\/$/, '');
        const respEmp = await fetch(`${base}empleado?first=0&max=50`);
        if (!respEmp.ok) return null;
        const empleados = await respEmp.json();
        for (const emp of (Array.isArray(empleados) ? empleados : [])) {
            const idEmp = emp.idEmpleado;
            if (!idEmp) continue;
            const respRol = await fetch(`${base}empleado/${idEmp}/rol?first=0&max=50`);
            if (!respRol.ok) continue;
            const roles = await respRol.json();
            const erActivo = (Array.isArray(roles) ? roles : []).find(r => r.activo !== false) || roles[0];
            if (erActivo?.idEmpleadoRol) {
                return erActivo.idEmpleadoRol;
            }
        }
        return null;
    }

    async _confirmarYEnviarOrden({ items, nombreCliente }) {
        if (this._enviandoOrden) return;
        this._enviandoOrden = true;
        this._limpiarError();
        const clienteLimpio = (nombreCliente || '').trim() || 'Consumidor Final';
        try {
            const idEmpleadoRolValido = await this._obtenerIdEmpleadoRolPorDefecto();
            if (!idEmpleadoRolValido) {
                throw {
                    mensaje: 'No se encontró ningún EmpleadoRol activo para asignar la orden en línea.'
                };
            }
            const resumenProductos = items
                .map(item => {
                    const detalleCar = item.personalizacion && item.personalizacion !== 'Estándar'
                        ? ` (${item.personalizacion})`
                        : '';
                    const etiquetaDesc = item.nombreDescuento ? ` [${item.nombreDescuento}]` : '';
                    return `${item.cantidad}x ${item.nombre}${detalleCar}${etiquetaDesc}`;
                })
                .join(', ');
            const observacionesOrden = [
                `[CLIENTE: ${clienteLimpio}]`,
                'Para llevar',
                resumenProductos
            ].filter(Boolean).join(' | ');
            const nuevaOrden = new Orden();
            nuevaOrden.idEmpleadoRol = { idEmpleadoRol: idEmpleadoRolValido };
            nuevaOrden.fechaCreacion = new Date().toISOString();
            nuevaOrden.observaciones = observacionesOrden;
            delete nuevaOrden.idOrden;
            const respOrden = await this.ordenDAO.create(nuevaOrden);
            const idOrdenGenerado = respOrden.datos?.id;
            if (!idOrdenGenerado) {
                throw {
                    mensaje: 'La orden se creó, pero no se pudo leer el ID desde la cabecera Location.'
                };
            }
            const ordenProductoDAO = new OrdenProductoDAO(idOrdenGenerado);
            for (const item of items) {
                for (let i = 0; i < item.cantidad; i++) {
                    const obsItem = [
                        `[CLIENTE: ${clienteLimpio}]`,
                        item.personalizacion || 'Estándar',
                        item.nombreDescuento ? `Promo: ${item.nombreDescuento}` : null
                    ].filter(Boolean).join(' | ');
                    const detalle = {
                        idProducto: { idProducto: item.idProducto },
                        precio: item.precio,
                        observaciones: obsItem
                    };
                    await ordenProductoDAO.create(detalle);
                }
            }
            this.carrito = [];
            this._ordenConfirmadaId = idOrdenGenerado;
            this._clienteConfirmado = clienteLimpio;
            this.pasoActual = 5;
            this._dibujar();
        } catch (err) {
            console.error('Error al registrar la orden pendiente:', err);
            const status = err?.error?.status || err?.status || null;
            let mensaje = err?.mensaje || err?.message || 'No se pudo registrar la orden. Revisa la conexión con el servidor.';
            if (err?.error?.headers) {
                const headerErr = err.error.headers.get('Wrong-parameter') || err.error.headers.get('Process-error');
                if (headerErr) mensaje += ` (${headerErr})`;
            }
            this._mostrarError(
                'Error al confirmar la orden',
                { status, mensaje },
                () => this._confirmarYEnviarOrden({ items, nombreCliente: clienteLimpio })
            );
        } finally {
            this._enviandoOrden = false;
        }
    }

    _dibujar() {
        const erroresActuales = this.root.querySelector('#zonaErrores')?.innerHTML || '';
        this.root.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: var(--fuente-principal, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
                    color: var(--texto-principal, #4B3621);
                }
                .zona-errores {
                    max-width: 1120px;
                    margin: 1rem auto 0;
                    padding: 0 1.25rem;
                }
                .estado-carga {
                    text-align: center;
                    padding: 3rem;
                    color: var(--texto-principal, #4B3621);
                    font-weight: 600;
                }
                .tarjeta-confirmacion {
                    max-width: 560px;
                    margin: 3rem auto;
                    padding: 2.5rem;
                    background: var(--bg-tarjeta, #FFFFFF);
                    border: 2px solid var(--borde-activo, #4B3621);
                    border-radius: var(--radio-panel, 14px);
                    box-shadow: var(--sombra-elevada, 0 4px 12px rgba(75, 54, 33, 0.16));
                    text-align: center;
                    color: var(--texto-principal, #4B3621);
                }
                .icono-exito {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 1rem;
                    border-radius: 50%;
                    background: var(--estado-listo-bg, #d4edda);
                    color: var(--estado-listo-txt, #155724);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 800;
                }
                .titulo-exito {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.75rem;
                }
                .texto-exito {
                    margin: 0 0 1.25rem 0;
                    color: var(--texto-secundario, #6e5740);
                }
                .codigo-orden {
                    background: var(--bg-app, #EDE0C8);
                    padding: 0.85rem;
                    border-radius: var(--radio-tarjeta, 10px);
                    font-weight: 800;
                    margin-bottom: 1.75rem;
                }
                .btn-nueva-orden {
                    padding: 0.85rem 2rem;
                    border: none;
                    border-radius: 999px;
                    background: var(--color-acento, #C8322B);
                    color: var(--texto-claro, #FFFFFF);
                    font-family: inherit;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                .btn-nueva-orden:hover {
                    background: var(--color-acento-hover, #a82822);
                }
            </style>
            <div class="zona-errores" id="zonaErrores">${erroresActuales}</div>
            <div id="contenidoPaso"></div>
        `;
        const contenedor = this.root.querySelector('#contenidoPaso');
        if (this.cargando) {
            const p = document.createElement('p');
            p.className = 'estado-carga';
            p.textContent = 'Cargando menú de Cafefe...';
            contenedor.appendChild(p);
            return;
        }
        if (this.pasoActual === 1) {
            const grid = document.createElement('grid-categorias');
            grid.categorias = this.categorias;
            grid.addEventListener('categoria-seleccionada', (e) => {
                this._limpiarError();
                this.categoriaSeleccionadaId = e.detail.idTipoProducto;
                this.pasoActual = 2;
                this._dibujar();
            });
            contenedor.appendChild(grid);
        } else if (this.pasoActual === 2) {
            const catalogo = document.createElement('catalogo-productos');
            catalogo.categorias = this.categorias;
            catalogo.productos = this.productos;
            catalogo.categoriaActivaId = this.categoriaSeleccionadaId;
            catalogo.idCategoriaDescuentos = this.idCategoriaDescuentos;
            catalogo.cantidadCarrito = this._totalItemsCarrito();
            catalogo.addEventListener('seleccionar-producto', (e) => {
                this._abrirDetalleProducto(e.detail);
            });
            catalogo.addEventListener('agregar-rapido', (e) => {
                this._abrirDetalleProducto(e.detail);
            });
            catalogo.addEventListener('ver-orden', () => {
                this._limpiarError();
                this.pasoActual = 4;
                this._dibujar();
            });
            contenedor.appendChild(catalogo);
        } else if (this.pasoActual === 3) {
            const detalle = document.createElement('detalle-producto');
            detalle.producto = this.productoSeleccionado;
            detalle.gruposCaracteristicas = this.gruposCaracteristicasProducto;
            detalle.addEventListener('agregar-carrito', (e) => {
                const { producto, personalizacion, cantidad } = e.detail;
                this._agregarAlCarrito(producto, personalizacion, cantidad);
                this.pasoActual = 2;
                this._dibujar();
            });
            detalle.addEventListener('regresar', () => {
                this._limpiarError();
                this.pasoActual = 2;
                this._dibujar();
            });
            contenedor.appendChild(detalle);
        } else if (this.pasoActual === 4) {
            const resumen = document.createElement('resumen-orden');
            resumen.items = this.carrito;
            resumen.addEventListener('actualizar-cantidad', (e) => {
                this._actualizarCantidadCarrito(e.detail.index, e.detail.delta);
            });
            resumen.addEventListener('seguir-pidiendo', () => {
                this._limpiarError();
                this.pasoActual = 2;
                this._dibujar();
            });
            resumen.addEventListener('confirmar-orden', (e) => {
                this._confirmarYEnviarOrden(e.detail);
            });
            contenedor.appendChild(resumen);
        } else if (this.pasoActual === 5) {
            const codigoCorto = String(this._ordenConfirmadaId || '').slice(0, 8).toUpperCase();
            contenedor.innerHTML = `
                <section class="tarjeta-confirmacion">
                    <div class="icono-exito">✓</div>
                    <h2 class="titulo-exito">¡Orden Confirmada, ${this._clienteConfirmado}!</h2>
                    <p class="texto-exito">Tu pedido quedó registrado como <strong>pendiente</strong> para pagar y recoger en el local.</p>
                    <div class="codigo-orden">Código de orden: #${codigoCorto}</div>
                    <button type="button" class="btn-nueva-orden" id="btnNuevaOrden">Hacer otro pedido</button>
                </section>
            `;
            contenedor.querySelector('#btnNuevaOrden').addEventListener('click', () => {
                this._ordenConfirmadaId = null;
                this._clienteConfirmado = '';
                this.pasoActual = 1;
                this._dibujar();
            });
        }
    }
}

customElements.define('pedido-model', PedidoModel);
export default PedidoModel;