import { TestRunner } from "../test_runner.js";

import "../../src/js/boundary/components/pedido/boton_guardar_orden.js";
import "../../src/js/boundary/components/pedido/catalogo_productos.js";
import "../../src/js/boundary/components/pedido/detalle_producto.js";
import "../../src/js/boundary/components/pedido/grid_categorias.js";
import "../../src/js/boundary/components/pedido/resumen_orden.js";

const sandbox = document.getElementById("sandbox");
const runner = new TestRunner(document.getElementById("resultados"));

function montar(tag, atributos = {}) {
    sandbox.innerHTML = "";
    const el = document.createElement(tag);
    Object.entries(atributos).forEach(([k, v]) => {
        if (v === true) el.setAttribute(k, "");
        else if (v !== false && v != null) el.setAttribute(k, v);
    });
    sandbox.appendChild(el);
    return el;
}

// 1. <boton-guardar-orden>
await runner.suite("1. <boton-guardar-orden>", async ({ test }) => {
    await test("Renderiza texto base con contador cuando cantidad > 0 y emite 'guardar-orden'", (t) => {
        const comp = montar("boton-guardar-orden", {
            texto: "Ver Orden",
            cantidad: "3"
        });
        const btn = comp.shadowRoot.getElementById("btnGuardarOrden");

        t.assertEqual(btn.textContent.trim(), "Ver Orden (3)");
        t.assertFalse(btn.disabled);

        let guardado = false;
        comp.addEventListener("guardar-orden", () => { guardado = true; });
        btn.click();

        t.assertTrue(guardado, "Debe emitir el evento 'guardar-orden'");
    });

    await test("No emite evento si tiene atributo disabled y omite contador si cantidad es 0", (t) => {
        const comp = montar("boton-guardar-orden", { disabled: true });
        const btn = comp.shadowRoot.getElementById("btnGuardarOrden");

        t.assertEqual(btn.textContent.trim(), "Guardar");
        t.assertTrue(btn.disabled);

        let guardado = false;
        comp.addEventListener("guardar-orden", () => { guardado = true; });
        btn.click();

        t.assertFalse(guardado, "No debe emitir 'guardar-orden' cuando está deshabilitado");
    });
});

// 2. <catalogo-productos>
await runner.suite("2. <catalogo-productos>", async ({ test }) => {
    const categoriasMock = [
        { idTipoProducto: 1, nombre: "Cafés" },
        { idTipoProducto: 2, nombre: "Promociones y Descuentos" }
    ];
    const productosMock = [
        { idProducto: 10, idTipoProducto: 1, nombre: "Latte", subcategoria: "Calientes", precioSugerido: 3.5, tieneDescuento: false },
        { idProducto: 11, idTipoProducto: 1, nombre: "Cold Brew", subcategoria: "Fríos", precioSugerido: 4.0, tieneDescuento: false },
        { idProducto: 12, idTipoProducto: 1, nombre: "Mocha Promo", precioSugerido: 3.0, precioOriginal: 4.0, porcentajeDescuento: 25, nombreDescuento: "Hora Feliz", tieneDescuento: true }
    ];

    await test("Filtra productos por categoría y subcategoría, y emite 'seleccionar-producto'", (t) => {
        const catalogo = montar("catalogo-productos");
        catalogo.categorias = categoriasMock;
        catalogo.productos = productosMock;

        let tarjetas = catalogo.shadowRoot.querySelectorAll("tarjeta-simple");
        t.assertEqual(tarjetas.length, 2);

        catalogo.shadowRoot.getElementById("tabSub-Fríos").click();
        tarjetas = catalogo.shadowRoot.querySelectorAll("tarjeta-simple");
        t.assertEqual(tarjetas.length, 1);
        t.assertEqual(tarjetas[0].id, "cardProd-11");

        let seleccionado = null;
        catalogo.addEventListener("seleccionar-producto", e => { seleccionado = e.detail; });
        tarjetas[0].querySelector("#btnAdd-11").click();

        t.assertEqual(seleccionado.idProducto, 11);
    });

    await test("Muestra productos con descuento en categoría de descuentos y emite 'ver-orden'", (t) => {
        const catalogo = montar("catalogo-productos");
        catalogo.categorias = categoriasMock;
        catalogo.productos = productosMock;
        catalogo.cantidadCarrito = 2;

        catalogo.shadowRoot.getElementById("btnCat-2").click();
        const tarjetas = catalogo.shadowRoot.querySelectorAll("tarjeta-simple");
        t.assertEqual(tarjetas.length, 1);
        t.assertEqual(tarjetas[0].id, "cardProd-12");

        let vioOrden = false;
        catalogo.addEventListener("ver-orden", () => { vioOrden = true; });
        catalogo.shadowRoot.getElementById("btnGuardarOrden").dispatchEvent(
            new CustomEvent("guardar-orden", { bubbles: true, composed: true })
        );

        t.assertTrue(vioOrden, "Debe propagar 'ver-orden' al pulsar guardar orden");
    });

    await test("Oculta botones de agregar y guardar en modo='lectura'", (t) => {
        const catalogo = montar("catalogo-productos", { modo: "lectura" });
        catalogo.categorias = categoriasMock;
        catalogo.productos = productosMock;
        catalogo.cantidadCarrito = 5;

        t.assertEqual(catalogo.shadowRoot.getElementById("btnGuardarOrden"), null);
        t.assertEqual(catalogo.shadowRoot.querySelector(".btn-agregar-card"), null);
    });
});

// 3. <detalle-producto>
await runner.suite("3. <detalle-producto>", async ({ test }) => {
    const prodMock = {
        idProducto: 5,
        nombre: "Capuccino",
        precioSugerido: 3.25,
        nombreTipoProducto: "Bebidas Calientes"
    };
    const gruposMock = [
        { nombre: "Tamaño", opciones: [{ etiqueta: "Mediano" }, { etiqueta: "Grande" }] },
        { nombre: "Leche", opciones: [{ etiqueta: "Entera" }, { etiqueta: "Almendra" }] }
    ];

    await test("Calcula subtotal al cambiar cantidad, arma personalización y emite 'agregar-carrito'", (t) => {
        const detalle = montar("detalle-producto");
        detalle.producto = prodMock;
        detalle.gruposCaracteristicas = gruposMock;

        const selectLeche = detalle.shadowRoot.getElementById("selectCar-1");
        selectLeche.value = "Almendra";
        selectLeche.dispatchEvent(new Event("change"));

        detalle.shadowRoot.getElementById("btnMas").click();
        t.assertEqual(detalle.shadowRoot.getElementById("valorCantidad").textContent, "2");

        let payload = null;
        detalle.addEventListener("agregar-carrito", e => { payload = e.detail; });
        detalle.shadowRoot.getElementById("btnAgregarCarrito").click();

        t.assertEqual(payload.cantidad, 2);
        t.assertEqual(payload.subtotal, 6.5);
        t.assertEqual(payload.personalizacion, "Tamaño: Mediano | Leche: Almendra");
    });

    await test("En modo 'solo-vista' oculta controles de compra y emite 'regresar'", (t) => {
        const detalle = montar("detalle-producto", { "solo-vista": true });
        detalle.producto = prodMock;

        t.assertEqual(detalle.shadowRoot.getElementById("btnAgregarCarrito"), null);

        let regreso = false;
        detalle.addEventListener("regresar", () => { regreso = true; });
        detalle.shadowRoot.querySelector(".btn-regresar").click();

        t.assertTrue(regreso, "Debe emitir 'regresar'");
    });
});

// 4. <grid-categorias>
await runner.suite("4. <grid-categorias>", async ({ test }) => {
    await test("Muestra estado vacío cuando no hay categorías", (t) => {
        const grid = montar("grid-categorias", { titulo: "Nuestras Categorías" });
        t.assertEqual(grid.shadowRoot.getElementById("tituloCategorias").textContent, "Nuestras Categorías");
        t.assertTrue(grid.shadowRoot.getElementById("categoriasVacias") !== null);
    });

    await test("Renderiza tarjetas de categorías y emite 'categoria-seleccionada'", (t) => {
        const grid = montar("grid-categorias");
        grid.categorias = [
            { idTipoProducto: 1, nombre: "Postres" },
            { idTipoProducto: 2, nombre: "Bebidas Frías" }
        ];

        const cards = grid.shadowRoot.querySelectorAll("tarjeta-simple");
        t.assertEqual(cards.length, 2);

        let seleccionada = null;
        grid.addEventListener("categoria-seleccionada", e => { seleccionada = e.detail; });
        cards[1].click();

        t.assertEqual(seleccionada.idTipoProducto, 2);
        t.assertEqual(seleccionada.nombre, "Bebidas Frías");
    });
});

// 5. <resumen-orden>
await runner.suite("5. <resumen-orden>", async ({ test }) => {
    const itemsMock = [
        { idProducto: 1, nombre: "Americano", precio: 2.0, cantidad: 2, personalizacion: "Sin azúcar" },
        { idProducto: 2, nombre: "Croissant", precio: 2.5, cantidad: 1 }
    ];

    await test("Calcula total, emite 'actualizar-cantidad' y valida nombre obligatorio antes de confirmar", (t) => {
        const resumen = montar("resumen-orden");
        resumen.items = itemsMock;

        t.assertTrue(resumen.shadowRoot.querySelector(".linea-total").textContent.includes("$6.50"));

        let cambio = null;
        resumen.addEventListener("actualizar-cantidad", e => { cambio = e.detail; });
        resumen.shadowRoot.querySelector("#itemCarrito-0 .btn-sumar").click();
        t.assertEqual(cambio.index, 0);
        t.assertEqual(cambio.delta, 1);

        let confirmado = null;
        resumen.addEventListener("confirmar-orden", e => { confirmado = e.detail; });
        resumen.shadowRoot.getElementById("btnConfirmarOrden").click();
        t.assertEqual(confirmado, null, "No debe confirmar si falta el nombre del cliente");
        t.assertTrue(resumen.shadowRoot.querySelector(".msg-error-campo") !== null);

        const inputNombre = resumen.shadowRoot.getElementById("nombreClienteInput");
        inputNombre.value = "  María López  ";
        inputNombre.dispatchEvent(new Event("input"));
        resumen.shadowRoot.getElementById("btnConfirmarOrden").click();

        t.assertEqual(confirmado.nombreCliente, "María López");
        t.assertEqual(confirmado.total, 6.5);
        t.assertEqual(confirmado.estado, "PENDIENTE");
    });
});

runner.resumen();