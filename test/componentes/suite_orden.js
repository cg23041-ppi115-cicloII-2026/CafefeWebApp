import { TestRunner } from "../test_runner.js";

import "../../src/js/boundary/components/orden/badge_tiempo_orden.js";
import "../../src/js/boundary/components/orden/tarjeta_horizontal.js";
import "../../src/js/boundary/components/orden/tarjeta_orden.js";
import "../../src/js/boundary/components/orden/orden_proceso.js";
import "../../src/js/boundary/components/orden/modal_cancelar_orden.js";
import "../../src/js/boundary/components/orden/modal_historial_orden.js";
import "../../src/js/boundary/components/orden/paginacion_ordenes.js";

const sandbox = document.getElementById("sandbox");
const runner = new TestRunner(document.getElementById("resultados"));

function montar(tag) {
    sandbox.innerHTML = "";
    const el = document.createElement(tag);
    sandbox.appendChild(el);
    return el;
}

// 1. <badge-tiempo-orden>
await runner.suite("1. <badge-tiempo-orden>", async ({ test }) => {
    await test("Oculta el badge si no recibe fecha o es inválida", (t) => {
        const badge = montar("badge-tiempo-orden");
        badge.fecha = "fecha-invalida";
        const span = badge.shadowRoot.querySelector("#etiqueta");
        t.assertTrue(span.hidden, "El span debe permanecer oculto");
    });

    await test("Muestra clase verde (< 8 min), amarilla (8-14 min) y roja (>= 15 min)", (t) => {
        const badge = montar("badge-tiempo-orden");
        badge.setAttribute("prefijo", "⏱ Espera:");

        badge.fecha = new Date(Date.now() - 2 * 60000).toISOString();
        const span = badge.shadowRoot.querySelector("#etiqueta");
        t.assertFalse(span.hidden);
        t.assertTrue(span.classList.contains("tiempo-verde"), "2 min debe ser verde");
        t.assertContains(span.textContent, "⏱ Espera: 2 min");

        badge.fecha = new Date(Date.now() - 10 * 60000).toISOString();
        t.assertTrue(span.classList.contains("tiempo-amarillo"), "10 min debe ser amarillo");

        badge.fecha = new Date(Date.now() - 18 * 60000).toISOString();
        t.assertTrue(span.classList.contains("tiempo-rojo"), "18 min debe ser rojo");
    });

    await test("Soporta fechas en formato arreglo [año, mes, día, hora, min]", (t) => {
        const badge = montar("badge-tiempo-orden");
        const ahora = new Date();
        badge.fecha = [ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate(), ahora.getHours(), ahora.getMinutes()];
        const span = badge.shadowRoot.querySelector("#etiqueta");
        t.assertFalse(span.hidden, "Debe parsear el arreglo de fecha correctamente");
    });
});

// 2. <tarjeta-horizontal>
await runner.suite("2. <tarjeta-horizontal>", async ({ test }) => {
    await test("Proyecta correctamente los slots titulo, contenido y pie", (t) => {
        sandbox.innerHTML = `
            <tarjeta-horizontal>
                <span slot="titulo">Título Prueba</span>
                <span slot="contenido">Cuerpo Prueba</span>
                <span slot="pie">Pie Prueba</span>
            </tarjeta-horizontal>
        `;
        const card = sandbox.querySelector("tarjeta-horizontal");
        const slots = card.shadowRoot.querySelectorAll("slot");
        t.assertEqual(slots.length, 3, "Debe tener 3 slots");
        t.assertEqual(slots[0].assignedNodes()[0].textContent, "Título Prueba");
        t.assertEqual(slots[1].assignedNodes()[0].textContent, "Cuerpo Prueba");
        t.assertEqual(slots[2].assignedNodes()[0].textContent, "Pie Prueba");
    });
});

// 3. <tarjeta-orden>
await runner.suite("3. <tarjeta-orden>", async ({ test }) => {
    const ordenDemo = {
        idOrden: "11111111-2222-3333-4444-5555555abc12",
        clienteNombre: "Sarita",
        fechaCreacion: new Date().toISOString()
    };

    await test("En modo 'pendiente' muestra botones Tomar y Cancelar y emite sus eventos", (t) => {
        const card = montar("tarjeta-orden");
        card.modo = "pendiente";
        card.datos = ordenDemo;

        t.assertContains(card.shadowRoot.textContent, "ORDEN #ABC12");
        t.assertContains(card.shadowRoot.querySelector(".cliente-nombre").textContent, "Sarita");

        let tomada = null;
        let cancelada = null;
        card.addEventListener("tomar-orden", e => { tomada = e.detail; });
        card.addEventListener("cancelar-orden", e => { cancelada = e.detail; });

        card.shadowRoot.querySelector("#btnAccion").click();
        t.assertEqual(tomada?.idOrden, ordenDemo.idOrden, "Debe emitir tomar-orden");

        card.shadowRoot.querySelector("#btnCancelar").click();
        t.assertEqual(cancelada?.idOrden, ordenDemo.idOrden, "Debe emitir cancelar-orden");
    });

    await test("En modo 'lista' oculta Cancelar y emite 'entregar-orden'", (t) => {
        const card = montar("tarjeta-orden");
        card.modo = "lista";
        card.datos = ordenDemo;

        t.assertEqual(card.shadowRoot.querySelector("#btnCancelar"), null, "No debe existir botón Cancelar");

        let entregada = null;
        card.addEventListener("entregar-orden", e => { entregada = e.detail; });

        card.shadowRoot.querySelector("#btnAccion").click();
        t.assertEqual(entregada?.idOrden, ordenDemo.idOrden, "Debe emitir entregar-orden");
    });
});

// 4. <orden-proceso>
await runner.suite("4. <orden-proceso>", async ({ test }) => {
    await test("Muestra estado vacío cuando no hay orden asignada", (t) => {
        const panel = montar("orden-proceso");
        panel.ordenActual = null;
        t.assertContains(panel.shadowRoot.textContent, "No hay ningún pedido en preparación");
    });

    await test("Habilita 'Pedido Listo' solo cuando todos los productos están marcados", (t) => {
        const panel = montar("orden-proceso");
        panel.ordenActual = {
            orden: { idOrden: "00000000-0000-0000-0000-000000099999", clienteNombre: "Karla" },
            productos: [
                { idProducto: "1", nombreProducto: "Americano", precio: 2.5, observacionesLimpias: "Sin azúcar", listo: false },
                { idProducto: "2", nombreProducto: "Muffin", precio: 3.0, listo: false }
            ]
        };

        const btnCompletar = panel.shadowRoot.querySelector("#btnCompletar");
        const contador = panel.shadowRoot.querySelector("#contadorListos");
        const checks = panel.shadowRoot.querySelectorAll('input[type="checkbox"]');

        t.assertTrue(btnCompletar.disabled, "Debe iniciar deshabilitado");
        t.assertEqual(contador.textContent, "0 / 2 listos");

        checks[0].checked = true;
        checks[0].dispatchEvent(new Event("change", { bubbles: true }));
        t.assertTrue(btnCompletar.disabled, "Con 1/2 listos debe seguir deshabilitado");
        t.assertEqual(contador.textContent, "1 / 2 listos");

        checks[1].checked = true;
        checks[1].dispatchEvent(new Event("change", { bubbles: true }));
        t.assertFalse(btnCompletar.disabled, "Con 2/2 listos debe habilitarse");
        t.assertEqual(contador.textContent, "2 / 2 listos");
    });

    await test("Emite eventos 'devolver-orden', 'cancelar-orden' y 'orden-completada'", (t) => {
        const panel = montar("orden-proceso");
        const orden = { idOrden: "00000000-0000-0000-0000-000000088888", clienteNombre: "Luis" };
        panel.ordenActual = {
            orden,
            productos: [{ idProducto: "1", nombreProducto: "Té", precio: 2.0, listo: true }]
        };

        const eventos = [];
        panel.addEventListener("devolver-orden", () => eventos.push("devolver"));
        panel.addEventListener("cancelar-orden", () => eventos.push("cancelar"));
        panel.addEventListener("orden-completada", () => eventos.push("completada"));

        panel.shadowRoot.querySelector("#btnDevolver").click();
        panel.shadowRoot.querySelector("#btnCancelar").click();
        panel.shadowRoot.querySelector("#btnCompletar").click();

        t.assertEqual(eventos.join(","), "devolver,cancelar,completada");
    });
});

// 5. <modal-cancelar-orden>
await runner.suite("5. <modal-cancelar-orden>", async ({ test }) => {
    await test("Captura motivo personalizado ('otro'), cierra el modal y emite 'confirmar-cancelacion'", (t) => {
        const modal = montar("modal-cancelar-orden");
        const orden = { idOrden: "00000000-0000-0000-0000-000000077777" };
        modal.abrir(orden);

        let detalleEvento = null;
        modal.addEventListener("confirmar-cancelacion", e => { detalleEvento = e.detail; });

        const radioOtro = modal.shadowRoot.querySelector('input[value="otro"]');
        radioOtro.checked = true;
        radioOtro.dispatchEvent(new Event("change"));

        const inputOtro = modal.shadowRoot.querySelector("#inputOtroMotivo");
        inputOtro.value = "Se terminó la leche deslactosada";

        modal.shadowRoot.querySelector("#btnConfirmarCancelar").click();

        t.assertEqual(detalleEvento?.orden?.idOrden, orden.idOrden);
        t.assertEqual(detalleEvento?.motivo, "Se terminó la leche deslactosada");
        t.assertEqual(modal.shadowRoot.innerHTML, "", "El modal debe cerrarse tras confirmar");
    });
});

// 6. <modal-historial-orden>
await runner.suite("6. <modal-historial-orden>", async ({ test }) => {
    const itemsTurno = [
        {
            orden: { idOrden: "00000000-0000-0000-0000-00000001111A", clienteNombre: "María", fechaCreacion: new Date().toISOString() },
            estado: "entregado",
            detalleEstado: "Entregado 02:30 p. m.",
            pagada: true
        },
        {
            orden: { idOrden: "00000000-0000-0000-0000-00000002222B", clienteNombre: "Pedro", fechaCreacion: new Date().toISOString() },
            estado: "cancelado",
            detalleEstado: "Cancelado - Producto agotado",
            pagada: false
        }
    ];

    await test("Deshabilita el botón si la orden ya está pagada y permite reabrir la cancelada", (t) => {
        const modal = montar("modal-historial-orden");
        modal.abrir(itemsTurno);

        const botones = modal.shadowRoot.querySelectorAll(".btn-reabrir");
        t.assertTrue(botones[0].disabled, "La orden pagada debe tener el botón deshabilitado");
        t.assertContains(botones[0].textContent, "Ya Pagada");

        t.assertFalse(botones[1].disabled, "La orden cancelada no pagada debe permitir reabrir");

        let reabierta = null;
        modal.addEventListener("reabrir-orden", e => { reabierta = e.detail; });
        botones[1].click();

        t.assertEqual(reabierta?.orden?.clienteNombre, "Pedro");
    });

    await test("Filtra órdenes en tiempo real usando <barra-busqueda>", (t) => {
        const modal = montar("modal-historial-orden");
        modal.abrir(itemsTurno);

        const buscador = modal.shadowRoot.querySelector("#buscadorTurno");
        buscador.dispatchEvent(new CustomEvent("buscar", { detail: "pedro", bubbles: true }));

        const filas = modal.shadowRoot.querySelectorAll(".item-historial");
        t.assertEqual(filas.length, 1, "Debe mostrar solo 1 resultado tras filtrar");
        t.assertContains(filas[0].textContent, "Pedro");
    });
});

// 7. <paginacion-ordenes>
await runner.suite("7. <paginacion-ordenes>", async ({ test }) => {
    await test("Controla botones Anterior/Siguiente y emite eventos de navegación", (t) => {
        const pag = montar("paginacion-ordenes");
        pag.configurar(0, true);

        const btnAnt = pag.shadowRoot.querySelector("#btnAnterior");
        const btnSig = pag.shadowRoot.querySelector("#btnSiguiente");
        const indicador = pag.shadowRoot.querySelector(".indicador-pagina");

        t.assertTrue(btnAnt.disabled, "En página 0 Anterior debe estar deshabilitado");
        t.assertFalse(btnSig.disabled, "Siguiente debe estar habilitado");
        t.assertEqual(indicador.textContent, "Pág. 1");

        let avanzo = false;
        pag.addEventListener("pagina-siguiente", () => { avanzo = true; });
        btnSig.click();
        t.assertTrue(avanzo, "Debe emitir 'pagina-siguiente'");
    });
});

runner.resumen();