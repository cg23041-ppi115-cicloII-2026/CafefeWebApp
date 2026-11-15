import { TestRunner } from "../test_runner.js";

import "../../src/js/boundary/components/barra_busqueda.js";
import "../../src/js/boundary/components/boton_cerrar_sesion.js";
import "../../src/js/boundary/components/boton_instalar_pwa.js";
import "../../src/js/boundary/components/cafefe_navbar.js";
import "../../src/js/boundary/components/mensaje_error.js";
import "../../src/js/boundary/components/tarjeta_simple.js";

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

// 1. <barra-busqueda>
await runner.suite("1. <barra-busqueda>", async ({ test }) => {
    await test("Renderiza placeholder personalizado, sincroniza value y emite 'buscar'", (t) => {
        const barra = montar("barra-busqueda", { placeholder: "Buscar cliente..." });
        const input = barra.shadowRoot.querySelector("#inputBuscar");

        t.assertEqual(input.placeholder, "Buscar cliente...");
        t.assertEqual(barra.shadowRoot.querySelector("#btnRefrescar"), null, "Sin atributo mostrar-refrescar no debe dibujar botón");

        let termino = null;
        barra.addEventListener("buscar", e => { termino = e.detail; });

        input.value = "sarita";
        input.dispatchEvent(new Event("input"));

        t.assertEqual(barra.value, "sarita");
        t.assertEqual(termino, "sarita");
    });

    await test("Muestra botón de actualización con 'mostrar-refrescar' y emite 'refrescar'", (t) => {
        const barra = montar("barra-busqueda", { "mostrar-refrescar": true });
        const btn = barra.shadowRoot.querySelector("#btnRefrescar");
        t.assertTrue(btn !== null, "Debe renderizar el botón refrescar");

        let refrescado = false;
        barra.addEventListener("refrescar", () => { refrescado = true; });
        btn.click();
        t.assertTrue(refrescado, "Debe emitir el evento 'refrescar'");
    });
});

// 2. <boton-cerrar-sesion>
await runner.suite("2. <boton-cerrar-sesion>", async ({ test }) => {
    await test("Muestra etiqueta de usuario, texto personalizado y emite 'cerrar-sesion'", (t) => {
        const btnComp = montar("boton-cerrar-sesion", {
            usuario: "Ana · Caja",
            texto: "Salir del Turno"
        });

        const badge = btnComp.shadowRoot.querySelector(".usuario-etiqueta");
        const boton = btnComp.shadowRoot.querySelector("#btnCerrarSesion");

        t.assertEqual(badge.textContent, "Ana · Caja");
        t.assertEqual(boton.textContent, "Salir del Turno");

        let cerro = false;
        btnComp.addEventListener("cerrar-sesion", () => { cerro = true; });
        boton.click();
        t.assertTrue(cerro, "Debe emitir 'cerrar-sesion'");
    });

    await test("Oculta el badge de usuario cuando el atributo 'usuario' está vacío", (t) => {
        const btnComp = montar("boton-cerrar-sesion");
        t.assertEqual(btnComp.shadowRoot.querySelector(".usuario-etiqueta"), null);
    });
});

// 3. <boton-instalar-pwa>
await runner.suite("3. <boton-instalar-pwa>", async ({ test }) => {
    await test("Se muestra cuando no está instalada y emite 'solicitar-instalacion-pwa' si no hay prompt nativo", async (t) => {
        localStorage.removeItem("cafefe_pwa_instalada");
        const pwa = montar("boton-instalar-pwa");
        await new Promise(r => setTimeout(r, 10));

        t.assertFalse(pwa.hidden, "Debe estar visible si no está instalada");
        let solicito = false;
        pwa.addEventListener("solicitar-instalacion-pwa", () => { solicito = true; });

        pwa.shadowRoot.querySelector("#btnInstalarPwa").click();
        t.assertTrue(solicito, "Debe emitir 'solicitar-instalacion-pwa'");
    });

    await test("Se oculta automáticamente si localStorage indica que la PWA ya está instalada", async (t) => {
        localStorage.setItem("cafefe_pwa_instalada", "true");
        const pwa = montar("boton-instalar-pwa");
        await new Promise(r => setTimeout(r, 10));

        t.assertTrue(pwa.hidden, "Debe ocultarse cuando cafefe_pwa_instalada es 'true'");
        localStorage.removeItem("cafefe_pwa_instalada");
    });
});

// 4. <cafefe-navbar>
await runner.suite("4. <cafefe-navbar>", async ({ test }) => {
    await test("Renderiza título, subcomponentes y oculta botones según atributos", (t) => {
        const nav = montar("cafefe-navbar", {
            titulo: "Cafefe · Cocina",
            usuario: "Carlos · Cocina",
            "ocultar-instalar": true
        });

        t.assertEqual(nav.shadowRoot.querySelector(".navbar-titulo").textContent, "Cafefe · Cocina");
        t.assertEqual(nav.shadowRoot.querySelector("boton-instalar-pwa"), null, "Debe ocultar instalar PWA");

        const logout = nav.shadowRoot.querySelector("boton-cerrar-sesion");
        t.assertTrue(logout !== null, "Debe mostrar cerrar sesión");
        t.assertEqual(logout.getAttribute("usuario"), "Carlos · Cocina");

        nav.setAttribute("ocultar-cerrar-sesion", "");
        t.assertEqual(nav.shadowRoot.querySelector("boton-cerrar-sesion"), null, "Debe ocultar cerrar sesión al agregar atributo");
    });
});

// 5. <mensaje-error>
await runner.suite("5. <mensaje-error>", async ({ test }) => {
    await test("Muestra título, código HTTP, detalle y emite 'reintentar-operacion' y 'cerrar-error'", (t) => {
        const alerta = montar("mensaje-error");
        alerta.titulo = "Fallo de conexión";
        alerta.error = { status: 500, mensaje: "Error interno del servidor" };
        alerta.reintentable = true;

        t.assertEqual(alerta.shadowRoot.querySelector(".titulo").textContent, "Fallo de conexión");
        t.assertEqual(alerta.shadowRoot.querySelector(".badge-codigo").textContent, "HTTP 500");
        t.assertEqual(alerta.shadowRoot.querySelector(".detalle").textContent, "Error interno del servidor");

        let reintento = false;
        let cerro = false;
        alerta.addEventListener("reintentar-operacion", () => { reintento = true; });
        alerta.addEventListener("cerrar-error", () => { cerro = true; });

        alerta.shadowRoot.querySelector("#btnReintentar").click();
        t.assertTrue(reintento, "Debe emitir 'reintentar-operacion'");

        alerta.shadowRoot.querySelector("#btnCerrar").click();
        t.assertTrue(cerro, "Debe emitir 'cerrar-error'");
        t.assertEqual(sandbox.querySelector("mensaje-error"), null, "Debe eliminarse del DOM al cerrar");
    });
});

// 6. <tarjeta-simple>
await runner.suite("6. <tarjeta-simple>", async ({ test }) => {
    await test("Proyecta los tres slots nombrados (titulo, contenido, pie)", (t) => {
        sandbox.innerHTML = `
            <tarjeta-simple>
                <h3 slot="titulo">Encabezado</h3>
                <p slot="contenido">Descripción del producto</p>
                <span slot="pie">$4.50</span>
            </tarjeta-simple>
        `;
        const card = sandbox.querySelector("tarjeta-simple");
        const slots = card.shadowRoot.querySelectorAll("slot");

        t.assertEqual(slots.length, 3);
        t.assertEqual(slots[0].assignedNodes()[0].textContent, "Encabezado");
        t.assertEqual(slots[1].assignedNodes()[0].textContent, "Descripción del producto");
        t.assertEqual(slots[2].assignedNodes()[0].textContent, "$4.50");
    });
});

runner.resumen();