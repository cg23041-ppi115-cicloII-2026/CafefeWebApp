import { TestRunner } from "../test_runner.js";

import "../../src/js/boundary/components/boton_instalar_pwa.js";
import "../../src/js/boundary/components/cafefe_navbar.js";
import "../../src/js/boundary/components/mensaje_error.js";
import "../../src/js/boundary/components/tarjeta_simple.js";
import "../../src/js/boundary/components/tarjeta_tipo_producto.js";

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

// 1. <boton-instalar-pwa>
await runner.suite("1. <boton-instalar-pwa>", async ({ test }) => {
    await test("Se muestra cuando no está instalada y emite 'solicitar-instalacion-pwa' si no hay prompt nativo", async (t) => {
        const originalGetRelated = navigator.getInstalledRelatedApps;
        if ("getInstalledRelatedApps" in navigator) {
            navigator.getInstalledRelatedApps = async () => [];
        }
        localStorage.removeItem("cafefe_pwa_instalada");

        try {
            const pwa = montar("boton-instalar-pwa");
            await new Promise(r => setTimeout(r, 30));

            t.assertFalse(pwa.hidden, "Debe estar visible si no está instalada");
            let solicito = false;
            pwa.addEventListener("solicitar-instalacion-pwa", () => { solicito = true; });

            const btn = pwa.shadowRoot.querySelector("#btnInstalarPwa");
            t.assertTrue(btn !== null, "Debe renderizar el botón #btnInstalarPwa");
            btn.click();
            t.assertTrue(solicito, "Debe emitir 'solicitar-instalacion-pwa'");
        } finally {
            if (originalGetRelated) {
                navigator.getInstalledRelatedApps = originalGetRelated;
            }
        }
    });

    await test("Se oculta automáticamente si localStorage indica que la PWA ya está instalada", async (t) => {
        const originalGetRelated = navigator.getInstalledRelatedApps;
        if ("getInstalledRelatedApps" in navigator) {
            navigator.getInstalledRelatedApps = async () => [];
        }
        localStorage.setItem("cafefe_pwa_instalada", "true");

        try {
            const pwa = montar("boton-instalar-pwa");
            await new Promise(r => setTimeout(r, 30));

            t.assertTrue(pwa.hidden, "Debe ocultarse cuando cafefe_pwa_instalada es 'true'");
        } finally {
            localStorage.removeItem("cafefe_pwa_instalada");
            if (originalGetRelated) {
                navigator.getInstalledRelatedApps = originalGetRelated;
            }
        }
    });
});

// 2. <cafefe-navbar>
await runner.suite("2. <cafefe-navbar>", async ({ test }) => {
    await test("Renderiza título y proyecta botones en el slot de acciones", (t) => {
        sandbox.innerHTML = `
            <cafefe-navbar titulo="Cafefe · Cocina">
                <button id="btnSalirTest" class="btn-outline">Cerrar Sesión</button>
            </cafefe-navbar>
        `;
        const nav = sandbox.querySelector("cafefe-navbar");

        t.assertEqual(nav.shadowRoot.querySelector(".navbar-titulo").textContent, "Cafefe · Cocina");

        const slot = nav.shadowRoot.querySelector("slot");
        const botones = slot ? slot.assignedElements() : [];
        t.assertEqual(botones.length, 1, "Debe proyectar el botón inyectado en el navbar");
        t.assertEqual(botones[0].id, "btnSalirTest");
    });
});

// 3. <mensaje-error>
await runner.suite("3. <mensaje-error>", async ({ test }) => {
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

// 4. <tarjeta-simple>
await runner.suite("4. <tarjeta-simple>", async ({ test }) => {
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

// 5. <tarjeta-tipoproducto>
await runner.suite("5. <tarjeta-tipoproducto>", async ({ test }) => {
    await test("Renderiza nombre, estado activo/inactivo, observaciones y emite 'seleccionar-tipo-producto'", (t) => {
        const tarjeta = montar("tarjeta-tipoproducto");
        tarjeta.datos = {
            idTipoProducto: 1,
            nombre: "Bebidas Calientes",
            activo: true,
            observaciones: "Café de especialidad"
        };

        const cardInterna = tarjeta.shadowRoot.querySelector("tarjeta-simple");
        t.assertTrue(cardInterna !== null, "Debe renderizar <tarjeta-simple> interna");

        const texto = cardInterna.textContent;
        t.assertTrue(texto.includes("Bebidas Calientes"), "Debe mostrar el nombre del tipo de producto");
        t.assertTrue(texto.includes("Café de especialidad"), "Debe mostrar las observaciones");
        t.assertTrue(texto.includes("Activo"), "Debe mostrar estado Activo");

        let seleccionado = null;
        tarjeta.addEventListener("seleccionar-tipo-producto", e => { seleccionado = e.detail; });
        cardInterna.click();

        t.assertEqual(seleccionado.idTipoProducto, 1, "Debe emitir el tipo de producto al hacer clic");
    });
});

runner.resumen();