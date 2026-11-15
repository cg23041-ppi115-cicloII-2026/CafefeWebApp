import { TestRunner } from "../test_runner.js";

import "../../src/js/boundary/components/pago/detalle_pedido_cobro.js";
import "../../src/js/boundary/components/pago/metodos_pago_split.js";
import "../../src/js/boundary/components/pago/resumen_abonos_pago.js";
import "../../src/js/boundary/components/pago/panel_cobro.js";
import "../../src/js/boundary/components/pago/modal_ticket_pdf.js";
import "../../src/js/boundary/components/pago/tabla_facturas.js";
import "../../src/js/boundary/components/pago/historial_facturas.js";

const sandbox = document.getElementById("sandbox");
const runner = new TestRunner(document.getElementById("resultados"));

function montar(tag) {
    sandbox.innerHTML = "";
    const el = document.createElement(tag);
    sandbox.appendChild(el);
    return el;
}

// 1. <detalle-pedido-cobro>
await runner.suite("1. <detalle-pedido-cobro>", async ({ test }) => {
    const ordenDemo = { idOrden: "00000000-0000-0000-0000-0000000abcde" };
    const productosDemo = [
        { nombreProducto: "Latte Vainilla", precio: 3.75 },
        { nombreProducto: "Cheesecake", precio: 4.25 }
    ];

    await test("Muestra productos, total y atajos de pago exacto por el saldo restante", (t) => {
        const det = montar("detalle-pedido-cobro");
        det.configurar({ orden: ordenDemo, productos: productosDemo, totalPedido: 8.00, saldoRestante: 5.00 });

        t.assertContains(det.shadowRoot.textContent, "PEDIDO #ABCDE");
        t.assertContains(det.shadowRoot.textContent, "$8.00");
        t.assertContains(det.shadowRoot.querySelector("#btnExactoEfectivo").textContent, "$5.00");

        let abonoEmitido = null;
        det.addEventListener("agregar-abono", e => { abonoEmitido = e.detail; });
        det.shadowRoot.querySelector("#btnExactoTarjeta").click();

        t.assertEqual(abonoEmitido?.tipoPago, "TARJETA");
        t.assertEqual(abonoEmitido?.monto, 5.00);
    });

    await test("Deshabilita botones de pago rápido cuando el saldo llega a $0.00", (t) => {
        const det = montar("detalle-pedido-cobro");
        det.configurar({ orden: ordenDemo, productos: productosDemo, totalPedido: 8.00, saldoRestante: 0 });

        t.assertTrue(det.shadowRoot.querySelector("#btnExactoEfectivo").disabled);
        t.assertTrue(det.shadowRoot.querySelector("#btnExactoTarjeta").disabled);
    });
});

// 2. <metodos-pago-split>
await runner.suite("2. <metodos-pago-split>", async ({ test }) => {
    await test("Emite abono con monto y referencia externa para Tarjeta y QR", (t) => {
        const met = montar("metodos-pago-split");
        met.saldoRestante = 15.00;

        let detalle = null;
        met.addEventListener("agregar-abono", e => { detalle = e.detail; });

        met.shadowRoot.querySelector("#inputQr").value = "7.50";
        met.shadowRoot.querySelector("#inputReferencia").value = "QR-9988";
        met.shadowRoot.querySelector("#btnQr").click();

        t.assertEqual(detalle?.tipoPago, "QR");
        t.assertEqual(detalle?.monto, 7.50);
        t.assertEqual(detalle?.referenciaExterna, "QR-9988");
    });

    await test("Bloquea todos los inputs y botones cuando saldoRestante es 0", (t) => {
        const met = montar("metodos-pago-split");
        met.saldoRestante = 0;

        t.assertTrue(met.shadowRoot.querySelector("#inputEfectivo").disabled);
        t.assertTrue(met.shadowRoot.querySelector("#btnEfectivo").disabled);
        t.assertTrue(met.shadowRoot.querySelector("#btnTarjeta").disabled);
        t.assertTrue(met.shadowRoot.querySelector("#btnQr").disabled);
    });
});

// 3. <resumen-abonos-pago>
await runner.suite("3. <resumen-abonos-pago>", async ({ test }) => {
    await test("Renderiza abonos, totales y emite 'quitar-abono' con el índice correcto", (t) => {
        const res = montar("resumen-abonos-pago");
        res.configurar({
            abonos: [
                { tipoPago: "TARJETA", monto: 5.00, referenciaExterna: "AUTH-1" },
                { tipoPago: "EFECTIVO", monto: 10.00, referenciaExterna: "" }
            ],
            totalPagado: 15.00,
            vuelto: 2.50
        });

        t.assertEqual(res.shadowRoot.querySelector("#txtRecibido").textContent, "$15.00");
        t.assertEqual(res.shadowRoot.querySelector("#txtVuelto").textContent, "$2.50");

        let indiceQuitado = null;
        res.addEventListener("quitar-abono", e => { indiceQuitado = e.detail; });
        res.shadowRoot.querySelectorAll(".btn-quitar-abono")[1].click();

        t.assertEqual(indiceQuitado, 1, "Debe emitir el índice 1 al eliminar el segundo abono");
    });
});

// 4. <panel-cobro>
await runner.suite("4. <panel-cobro>", async ({ test }) => {
    const pedidoMock = {
        orden: { idOrden: "00000000-0000-0000-0000-000000055555", clienteNombre: "Sarita" },
        productos: [
            { idProducto: "p1", nombreProducto: "Capuccino", precio: 4.00 },
            { idProducto: "p2", nombreProducto: "Tarta", precio: 6.00 }
        ]
    };

    await test("Muestra estado vacío si no hay orden seleccionada", (t) => {
        const panel = montar("panel-cobro");
        panel.pedidoActual = null;
        t.assertContains(panel.shadowRoot.textContent, "Selecciona una orden pendiente");
    });

    await test("Calcula vuelto en efectivo y emite 'procesar-pago' al liquidar", (t) => {
        const panel = montar("panel-cobro");
        panel.pedidoActual = pedidoMock; // Total: $10.00

        const btnFinalizar = panel.shadowRoot.querySelector("#btnFinalizar");
        t.assertTrue(btnFinalizar.disabled, "Debe iniciar deshabilitado");

        panel.shadowRoot.dispatchEvent(new CustomEvent("agregar-abono", {
            detail: { tipoPago: "TARJETA", monto: 6.00, referenciaExterna: "VISA-12" },
            bubbles: true
        }));
        t.assertTrue(btnFinalizar.disabled, "Faltan $4.00 para liquidar");

        panel.shadowRoot.dispatchEvent(new CustomEvent("agregar-abono", {
            detail: { tipoPago: "EFECTIVO", monto: 5.00, referenciaExterna: "" },
            bubbles: true
        }));

        t.assertFalse(btnFinalizar.disabled, "Debe habilitarse al liquidar los $10.00");

        let payloadPago = null;
        panel.addEventListener("procesar-pago", e => { payloadPago = e.detail; });
        btnFinalizar.click();

        t.assertEqual(payloadPago?.totalPedido, 10.00);
        t.assertEqual(payloadPago?.totalPagado, 11.00);
        t.assertEqual(payloadPago?.vuelto, 1.00);
        t.assertEqual(payloadPago?.abonos?.length, 2);
    });
});

// 5. <modal-ticket-pdf>
await runner.suite("5. <modal-ticket-pdf>", async ({ test }) => {
    await test("Renderiza comprobante completo con cliente, productos, abonos y vuelto, y cierra al dar Listo", (t) => {
        const modal = montar("modal-ticket-pdf");
        modal.abrir({
            idFactura: "99999999-aaaa-bbbb-cccc-000000123456",
            cliente: "Carlos Méndez",
            orden: { idOrden: "00000000-0000-0000-0000-000000077777" },
            productos: [{ nombreProducto: "Espresso Doble", precio: 3.00 }],
            abonos: [{ tipoPago: "EFECTIVO", monto: 5.00, referenciaExterna: "" }],
            totalPedido: 3.00,
            totalPagado: 5.00,
            vuelto: 2.00,
            fecha: "15/11/2026, 5:00 p. m."
        });

        const texto = modal.shadowRoot.querySelector("#areaTicket").textContent;
        t.assertContains(texto, "#F-123456");
        t.assertContains(texto, "#77777");
        t.assertContains(texto, "Carlos Méndez");
        t.assertContains(texto, "Espresso Doble");
        t.assertContains(texto, "$2.00");

        modal.shadowRoot.querySelector("#btnCerrarTicket").click();
        t.assertEqual(modal.shadowRoot.innerHTML, "", "Debe limpiar el DOM al cerrar");
    });
});

// 6. <tabla-facturas>
await runner.suite("6. <tabla-facturas>", async ({ test }) => {
    const listaFacturas = [
        { idFactura: "fac-1", numeroFormateado: "000101", fechaFormateada: "15/11/2026 10:00", cliente: "Ana", observaciones: "Orden #111" },
        { idFactura: "fac-2", numeroFormateado: "000102", fechaFormateada: "15/11/2026 11:30", cliente: "Luis", observaciones: "Orden #222" }
    ];

    await test("Deshabilita el botón mientras carga un comprobante y emite 'seleccionar-factura' en los activos", (t) => {
        const tabla = montar("tabla-facturas");
        tabla.datos = { facturas: listaFacturas, cargandoId: "fac-1" };

        const botones = tabla.shadowRoot.querySelectorAll(".btn-ver-ticket");
        t.assertTrue(botones[0].disabled, "La factura en carga debe tener botón deshabilitado");
        t.assertContains(botones[0].textContent, "Cargando...");
        t.assertFalse(botones[1].disabled);

        let seleccionada = null;
        tabla.addEventListener("seleccionar-factura", e => { seleccionada = e.detail; });
        botones[1].click();

        t.assertEqual(seleccionada?.idFactura, "fac-2");
    });
});

// 7. <historial-facturas>
await runner.suite("7. <historial-facturas>", async ({ test }) => {
    const facturasDemo = [
        { idFactura: "f1", numeroFormateado: "0001", cliente: "Sarita", observaciones: "Orden #A1", fechaFormateada: "15/11/2026" },
        { idFactura: "f2", numeroFormateado: "0002", cliente: "Roberto", observaciones: "Orden #B2", fechaFormateada: "15/11/2026" }
    ];

    await test("Filtra facturas en <tabla-facturas> al buscar y emite 'recargar-historial' al refrescar", (t) => {
        const hist = montar("historial-facturas");
        hist.facturas = facturasDemo;

        const buscador = hist.shadowRoot.querySelector("#buscadorFacturas");
        buscador.dispatchEvent(new CustomEvent("buscar", { detail: "roberto", bubbles: true }));

        const tabla = hist.shadowRoot.querySelector("tabla-facturas");
        const filas = tabla.shadowRoot.querySelectorAll("tbody tr");
        t.assertEqual(filas.length, 1, "Solo debe quedar la fila de Roberto");
        t.assertContains(filas[0].textContent, "Roberto");

        let recargo = false;
        hist.addEventListener("recargar-historial", () => { recargo = true; });
        buscador.dispatchEvent(new CustomEvent("refrescar", { bubbles: true }));
        t.assertTrue(recargo, "Debe emitir 'recargar-historial'");
    });
});

runner.resumen();