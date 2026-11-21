import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import PagoModel from "../../../../src/js/boundary/pago_model.js";
import DefaultResponse from "../../../../src/js/entity/default_response.js";

mocha.setup("tdd");

function crearDefaultResponse(datos, total = 0) {
    const resp = new DefaultResponse();
    resp.datos = datos;
    resp.total_datos = String(total);
    return resp;
}

function leerTituloAlerta(alerta) {
    return alerta?.titulo
        || alerta?._titulo
        || alerta?.shadowRoot?.querySelector(".titulo, h3, strong")?.textContent
        || "";
}

suite("PagoModel Unit Test (Cobertura Completa)", function () {
    let cut;
    let sandbox;

    setup(function () {
        sandbox = sinon.createSandbox();
        cut = new PagoModel();
        sandbox.stub(cut, "connectedCallback");
        document.body.appendChild(cut);
        cut._dibujarLayout();
    });

    teardown(function () {
        sandbox.restore();
        if (cut && cut.parentNode) {
            cut.parentNode.removeChild(cut);
        }
    });

    suite("_cargarCajaActiva()", function () {
        test("Camino bueno: debe seleccionar la caja con activa !== false", function (done) {
            sandbox.stub(cut._cajaDAO, "findRange").resolves(
                crearDefaultResponse([
                    { idCaja: "c1", activa: false },
                    { idCaja: "c2", activa: true }
                ], 2)
            );

            cut._cargarCajaActiva()
                .then(() => {
                    chai.assert.isNotNull(cut._cajaActiva);
                    chai.assert.equal(cut._cajaActiva.idCaja, "c2");
                    done();
                })
                .catch(done);
        });

        test("Camino malo: debe mostrar error si falla _cajaDAO", function (done) {
            sandbox.stub(cut._cajaDAO, "findRange").rejects(new Error("Sin acceso"));

            cut._cargarCajaActiva()
                .then(() => {
                    const alerta = cut._root.querySelector("mensaje-error");
                    chai.assert.isNotNull(alerta);
                    chai.assert.include(leerTituloAlerta(alerta), "No se pudo obtener la caja activa");
                    done();
                })
                .catch(done);
        });
    });

    suite("_cargarOrdenesPorCobrar()", function () {
        test("Camino bueno: debe ignorar órdenes pagadas y canceladas y sumar precios", function (done) {
            sandbox.stub(cut._ordenDAO, "findRange").resolves(
                crearDefaultResponse([
                    { idOrden: "ord-PAG01" },
                    { idOrden: "ord-CAN02" },
                    { idOrden: "ord-PEN03" }
                ], 3)
            );
            sandbox.stub(cut, "_obtenerOrdenesYaFacturadas").resolves(new Set(["PAG01"]));

            sandbox.stub(window, "fetch").callsFake(url => {
                const headers = { "Content-Type": "application/json", "Total-Records": "1" };
                if (url.includes("ord-CAN02")) {
                    return Promise.resolve(new Response(JSON.stringify([{ idOrdenProducto: "1", idProducto: "p1", precio: 5, observaciones: "Cancelado" }]), { status: 200, headers }));
                }
                return Promise.resolve(new Response(JSON.stringify([
                    { idOrdenProducto: "2", idProducto: "p1", precio: 2.50, observaciones: "[CLIENTE: Mario]" },
                    { idOrdenProducto: "3", idProducto: "p2", precio: 1.50, observaciones: "" }
                ]), { status: 200, headers: { "Content-Type": "application/json", "Total-Records": "2" } }));
            });

            cut._cargarOrdenesPorCobrar()
                .then(() => {
                    chai.assert.lengthOf(cut._ordenesPorCobrar, 1);
                    chai.assert.equal(cut._ordenesPorCobrar[0].orden.idOrden, "ord-PEN03");
                    chai.assert.equal(cut._ordenesPorCobrar[0].total, 4.00);
                    chai.assert.equal(cut._ordenesPorCobrar[0].cliente, "Mario");
                    done();
                })
                .catch(done);
        });

        test("Camino malo: debe mostrar error si falla _ordenDAO", function (done) {
            sandbox.stub(cut._ordenDAO, "findRange").rejects(new Error("Error 503"));
            sandbox.stub(cut, "_obtenerOrdenesYaFacturadas").resolves(new Set());

            cut._cargarOrdenesPorCobrar()
                .then(() => {
                    const alerta = cut._root.querySelector("mensaje-error");
                    chai.assert.isNotNull(alerta);
                    done();
                })
                .catch(done);
        });
    });

    suite("_cargarHistorialFacturas() y _reimprimirFacturaHistorica()", function () {
        test("Camino malo (_cargarHistorialFacturas): debe vaciar facturas del componente y mostrar error si falla", function (done) {
            cut._subvista = "historial";
            cut._dibujarLayout();
            sandbox.stub(cut._historialModel, "obtenerFacturasOrdenadas").rejects(new Error("DB Error"));

            cut._cargarHistorialFacturas()
                .then(() => {
                    const vista = cut._root.querySelector("#vistaHistorial");
                    const listaFacturas = vista.facturas ?? vista._facturas ?? [];
                    chai.assert.isEmpty(listaFacturas);
                    chai.assert.isNotNull(cut._root.querySelector("mensaje-error"));
                    done();
                })
                .catch(done);
        });

        test("Camino bueno (_reimprimirFacturaHistorica): debe construir ticket y limpiar cargandoId en finally", function (done) {
            cut._subvista = "historial";
            cut._dibujarLayout();
            sandbox.stub(cut._historialModel, "construirDetalleTicket").resolves({ idFactura: "f1", productos: [] });
            const modal = cut._root.querySelector("modal-ticket-pdf");
            const spyAbrir = sandbox.spy(modal, "abrir");

            cut._reimprimirFacturaHistorica({ idFactura: "f1" })
                .then(() => {
                    chai.assert.isTrue(spyAbrir.calledOnce);
                    const vista = cut._root.querySelector("#vistaHistorial");
                    const cargandoActual = vista.cargandoId !== undefined ? vista.cargandoId : vista._cargandoId;
                    chai.assert.isNull(cargandoActual ?? null);
                    done();
                })
                .catch(done);
        });
    });

    suite("_procesarTransaccion()", function () {
        const payloadBase = {
            orden: { idOrden: "ord-12345", idEmpleadoRol: "er-1", clienteNombre: "Ana" },
            productos: [{ idOrdenProducto: "op-1", precio: 4.00, observaciones: "" }],
            abonos: [{ tipoPago: "EFECTIVO", monto: 5.00, referenciaExterna: "" }],
            totalPedido: 4.00,
            totalPagado: 5.00,
            vuelto: 1.00
        };

        test("Camino malo (sin caja activa): debe abortar y mostrar 'Caja no configurada'", function () {
            cut._cajaActiva = null;
            cut._procesarTransaccion(payloadBase);

            const alerta = cut._root.querySelector("mensaje-error");
            chai.assert.isNotNull(alerta);
            chai.assert.include(leerTituloAlerta(alerta), "Caja no configurada");
        });

        test("Camino malo (sin idEmpleadoRol): debe abortar y mostrar 'Orden sin empleado asignado'", function () {
            cut._cajaActiva = { idCaja: "caja-1" };
            const sinEmpleado = { ...payloadBase, orden: { idOrden: "ord-12345" } };
            cut._procesarTransaccion(sinEmpleado);

            const alerta = cut._root.querySelector("mensaje-error");
            chai.assert.isNotNull(alerta);
            chai.assert.include(leerTituloAlerta(alerta), "Orden sin empleado asignado");
        });

        test("Camino malo (servidor no devuelve ID de factura): debe capturar error y apagar procesando", function (done) {
            cut._cajaActiva = { idCaja: "caja-1" };
            sandbox.stub(cut._facturaDAO, "create").resolves(crearDefaultResponse({ id: null }, 1));

            cut._procesarTransaccion(payloadBase)
                .then(() => {
                    const panel = cut._root.querySelector("#visorCobro");
                    const estadoProcesando = panel.procesando !== undefined ? panel.procesando : Boolean(panel._procesando);
                    chai.assert.isFalse(estadoProcesando);
                    const alerta = cut._root.querySelector("mensaje-error");
                    chai.assert.isNotNull(alerta);
                    chai.assert.include(leerTituloAlerta(alerta), "Error al registrar el pago en el sistema");
                    done();
                })
                .catch(done);
        });

        test("Camino bueno: debe completar Factura -> Productos -> Pago -> Detalles y limpiar selección", function (done) {
            cut._cajaActiva = { idCaja: "caja-1" };
            sandbox.stub(cut._facturaDAO, "create").resolves(crearDefaultResponse({ id: "fac-1" }, 1));
            sandbox.stub(cut._pagoDAO, "create").resolves(crearDefaultResponse({ id: "pag-1" }, 1));
            sandbox.stub(cut, "_cargarOrdenesPorCobrar").resolves();
            sandbox.stub(window, "fetch").resolves(new Response(null, { status: 201 }));

            cut._procesarTransaccion(payloadBase)
                .then(() => {
                    chai.assert.isTrue(cut._facturaDAO.create.calledOnce);
                    chai.assert.isTrue(cut._pagoDAO.create.calledOnce);
                    chai.assert.isTrue(cut._cargarOrdenesPorCobrar.calledOnce);
                    chai.assert.isNull(cut._ordenSeleccionada);
                    done();
                })
                .catch(done);
        });
    });
});

mocha.run();