const CACHE_NAME = "cafefe-app-v1.0.7";
const ARCHIVOS_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",

    "./resources/img/logo_cafe.png",
    "./resources/img/logo_cafe_192.png",
    "./resources/img/logo_cafe_512.png",

    // Imágenes de categorías
    "./resources/img/categorias/bebidas.png",
    "./resources/img/categorias/desayunos.png",
    "./resources/img/categorias/merch.png",
    "./resources/img/categorias/postres.png",
    "./resources/img/categorias/temporada_y_combos.png",

    // Imágenes representativas de productos
    "./resources/img/productos/bebida_caliente.png",
    "./resources/img/productos/bebida_fria.png",
    "./resources/img/productos/cuerno.png",
    "./resources/img/productos/pan-de-molde.png",
    "./resources/img/productos/pastel.png",
    "./resources/img/productos/reposteria.png",
    "./resources/img/productos/termo.png",
    "./resources/img/productos/te-verde.png",

  // Estilos
    "./resources/estilos/index.css",
    "./resources/estilos/principal.css",
    "./resources/estilos/orden_model.css",
    "./resources/estilos/pago_model.css",
    "./resources/estilos/tarjeta.css",
    "./resources/estilos/components/cafefe_navbar.css",
    "./resources/estilos/components/catalogo_productos.css",
    "./resources/estilos/components/boton_instalar_pwa.css",
    "./resources/estilos/components/detalle_producto.css",
    "./resources/estilos/components/grid_categorias.css",
    "./resources/estilos/components/historial_facturas.css",
    "./resources/estilos/components/login_cafefe.css",
    "./resources/estilos/components/mensaje_error.css",
    "./resources/estilos/components/modal_historial_orden.css",
    "./resources/estilos/components/orden_proceso.css",
    "./resources/estilos/components/panel_cobro.css",
    "./resources/estilos/components/resumen_orden.css",
    "./resources/estilos/components/tabla_facturas.css",
    "./resources/estilos/components/tarjeta_horizontal.css",
    "./resources/estilos/components/tarjeta_orden.css",

    // Boundary Models y Componentes
    "./js/boundary/main.js",
    "./js/boundary/historial_facturas_model.js",
    "./js/boundary/orden_model.js",
    "./js/boundary/pago_model.js",
    "./js/boundary/pedido_model.js",
    "./js/boundary/tipo_producto_model.js",
    "./js/boundary/login_model.js",
    "./js/boundary/components/cafefe_navbar.js",
    "./js/boundary/components/mensaje_error.js",
    "./js/boundary/components/boton_instalar_pwa.js",
    "./js/boundary/components/tarjeta_simple.js",
    "./js/boundary/components/tarjeta_tipo_producto.js",
    "./js/boundary/components/login/login_cafefe.js",
    "./js/boundary/components/orden/modal_cancelar_orden.js",
    "./js/boundary/components/orden/modal_historial_orden.js",
    "./js/boundary/components/orden/orden_header.js",
    "./js/boundary/components/orden/orden_proceso.js",
    "./js/boundary/components/orden/paginacion_ordenes.js",
    "./js/boundary/components/orden/tarjeta_horizontal.js",
    "./js/boundary/components/orden/tarjeta_orden.js",
    "./js/boundary/components/pago/detalle_pedido_cobro.js",
    "./js/boundary/components/pago/historial_facturas.js",
    "./js/boundary/components/pago/metodos_pago_split.js",
    "./js/boundary/components/pago/modal_ticket_pdf.js",
    "./js/boundary/components/pago/panel_cobro.js",
    "./js/boundary/components/pago/resumen_abonos_pago.js",
    "./js/boundary/components/pedido/boton_guardar_orden.js",
    "./js/boundary/components/pedido/catalogo_productos.js",
    "./js/boundary/components/pedido/detalle_producto.js",
    "./js/boundary/components/pedido/grid_categorias.js",
    "./js/boundary/components/pedido/resumen_orden.js",

    // Control (DAOs y SessionManager)
    "./js/control/default_dao.js",
    "./js/control/caja_dao.js",
    "./js/control/caracteristica_dao.js",
    "./js/control/descuento_dao.js",
    "./js/control/descuento_producto_dao.js",
    "./js/control/factura_dao.js",
    "./js/control/factura_orden_producto_dao.js",
    "./js/control/orden_dao.js",
    "./js/control/orden_producto_dao.js",
    "./js/control/pago_dao.js",
    "./js/control/pago_detalle_dao.js",
    "./js/control/producto_dao.js",
    "./js/control/producto_caracteristica_dao.js",
    "./js/control/producto_tipo_producto_dao.js",
    "./js/control/session_manager.js",
    "./js/control/tipo_caracteristica_dao.js",
    "./js/control/tipo_descuento_dao.js",
    "./js/control/tipo_producto_dao.js",
    "./js/control/empleado_dao.js",
    "./js/control/empleado_rol_dao.js",

    // Entity
    "./js/entity/default_error.js",
    "./js/entity/default_response.js",
    "./js/entity/orden.js",
    "./js/entity/tipo_producto.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARCHIVOS_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    const req = event.request;
    const url = new URL(req.url);

    // 1. Nunca interceptar peticiones que no sean GET ni llamadas a la API REST
    if (req.method !== "GET" || url.pathname.includes("/cafefe/v1/")) {
        return;
    }

    // 2. Navegación SPA: Network-First con fallback a ./index.html
    if (req.mode === "navigate" || req.destination === "document" || url.pathname.endsWith(".html")) {
        event.respondWith(
            fetch(req)
                .then(networkResp => {
                    if (networkResp && networkResp.ok) {
                        const copia = networkResp.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(req, copia));
                    }
                    return networkResp;
                })
                .catch(() => caches.match(req).then(res => res || caches.match("./index.html")))
        );
        return;
    }

    // 3. Scripts JS: Network-First para reflejar cambios recientes sin congelar módulos
    if (req.destination === "script" || url.pathname.endsWith(".js")) {
        event.respondWith(
            fetch(req)
                .then(networkResp => {
                    if (networkResp && networkResp.ok) {
                        const copia = networkResp.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(req, copia));
                    }
                    return networkResp;
                })
                .catch(() => caches.match(req))
        );
        return;
    }

    // 4. Activos estáticos (CSS, imágenes, iconos, manifest): Cache-First
    event.respondWith(
        caches.match(req).then(cachedResp => {
            return cachedResp || fetch(req).then(networkResp => {
                if (networkResp && networkResp.ok) {
                    const copia = networkResp.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(req, copia));
                }
                return networkResp;
            });
        })
    );
});