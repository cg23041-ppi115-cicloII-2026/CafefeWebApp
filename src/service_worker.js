const CACHE_NAME = "cafefe-app-v1.0.0";

const ARCHIVOS_CACHE = [
    "./",
    "./index.html",
    "./login.html",
    "./orden.html",
    "./pago.html",
    "./pedido.html",
    "./manifest.json",

    "./resources/img/logo_cafe.png",
    "./resources/img/logo_cafe_192.png",
    "./resources/img/logo_cafe_512.png",
    
    "./resources/estilos/index.css",
    "./resources/estilos/principal.css",
    "./resources/estilos/orden_model.css",
    "./resources/estilos/pago_model.css",
    "./resources/estilos/tarjeta.css",
    "./resources/estilos/components/catalogo_productos.css",
    "./resources/estilos/components/boton_instalar_pwa.css",
    "./resources/estilos/components/detalle_producto.css",
    "./resources/estilos/components/grid_categorias.css",
    "./resources/estilos/components/login_cafefe.css",
    "./resources/estilos/components/mensaje_error.css",
    "./resources/estilos/components/orden_proceso.css",
    "./resources/estilos/components/panel_cobro.css",
    "./resources/estilos/components/resumen_orden.css",
    "./resources/estilos/components/tarjeta_horizontal.css",
    "./resources/estilos/components/tarjeta_orden.css",


    "./js/boundary/main.js",
    "./js/boundary/orden_model.js",
    "./js/boundary/pago_model.js",
    "./js/boundary/pedido_model.js",
    "./js/boundary/tipo_producto_model.js",
    "./js/boundary/login_model.js",
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
    "./js/boundary/components/pedido/catalogo_productos.js",
    "./js/boundary/components/pedido/detalle_producto.js",
    "./js/boundary/components/pedido/grid_categorias.js",
    "./js/boundary/components/pedido/resumen_orden.js",

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
    './js/control/empleado_dao.js',
    './js/control/empleado_rol_dao.js',

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
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
