import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import HistorialFacturasModel from "../../../../src/js/boundary/historial_facturas_model.js";
import DefaultResponse from "../../../../src/js/entity/default_response.js";

mocha.setup("tdd");

function crearDefaultResponse(datos, total = 0) {
    const resp = new DefaultResponse();
    resp.datos = datos;
    resp.total_datos = String(total);
    return resp;
}

suite("HistorialFacturasModel Unit Test (Cobertura Completa)", function () {
    let cut;
    let sandbox;

    setup(function () {
        sandbox = sinon.createSandbox();
        cut = new HistorialFacturasModel();
    });

    teardown(function () {
        sandbox.restore();
    });

    suite("formatearFecha()", function () {
        test("Camino bueno: debe formatear fecha ISO limpiando zona entre corchetes", function () {
            const res = cut.formatearFecha("2026-11-20T14:30:00Z[America/El_Salvador]");
            chai.assert.isString(res);
            chai.assert.notEqual(res, "Sin fecha");
            chai.assert.notInclude(res, "[America/El_Salvador]");
        });

        test("Camino malo: debe retornar 'Sin fecha' si es null/undefined/vacío y devolver cadena limpia si es inválida", function () {
            chai.assert.equal(cut.formatearFecha(null), "Sin fecha");
            chai.assert.equal(cut.formatearFecha(""), "Sin fecha");
            chai.assert.equal(cut.formatearFecha("fecha-invalida[UTC]"), "fecha-invalida");
        });
    });

    suite("cargarMapaProductos()", function () {
        test("Camino bueno: debe llenar _mapaProductos con idProducto -> nombre", function (done) {
            sandbox.stub(cut._productoDAO, "findRange").resolves(
                crearDefaultResponse([
                    { idProducto: "10", nombre: "Espresso" },
                    { idProducto: "20", nombre: "Muffin" }
                ], 2)
            );

            cut.cargarMapaProductos()
                .then(() => {
                    chai.assert.equal(cut._mapaProductos.size, 2);
                    chai.assert.equal(cut._mapaProductos.get("10"), "Espresso");
                    done();
                })
                .catch(done);
        });

        test("Camino malo: no debe rechazar si falla el DAO, debe continuar sin romper", function (done) {
            sandbox.stub(cut._productoDAO, "findRange").rejects(new Error("Fallo API"));

            cut.cargarMapaProductos()
                .then(() => {
                    chai.assert.equal(cut._mapaProductos.size, 0);
                    done();
                })
                .catch(done);
        });
    });

    suite("obtenerFacturasOrdenadas()", function () {
        test("Camino bueno: debe ordenar descendente por fecha y formatear número", function (done) {
            cut._mapaProductos.set("1", "Café");
            sandbox.stub(cut._facturaDAO, "findRange").resolves(
                crearDefaultResponse([
                    { idFactura: "abcdef123456", fechaFacturacion: "2026-11-20T08:00:00Z" },
                    { idFactura: "xyz999888777", fechaFacturacion: "2026-11-20T18:00:00Z" }
                ], 2)
            );

            cut.obtenerFacturasOrdenadas()
                .then(lista => {
                    chai.assert.lengthOf(lista, 2);
                    chai.assert.equal(lista[0].idFactura, "xyz999888777");
                    chai.assert.equal(lista[0].numeroFormateado, "888777");
                    done();
                })
                .catch(done);
        });

        test("Camino malo: debe propagar el rechazo si _facturaDAO.findRange falla", function (done) {
            cut._mapaProductos.set("1", "Café");
            sandbox.stub(cut._facturaDAO, "findRange").rejects(new Error("Error 500"));

            cut.obtenerFacturasOrdenadas()
                .then(() => done(new Error("Se esperaba que rechazara")))
                .catch(err => {
                    chai.assert.equal(err.message, "Error 500");
                    done();
                });
        });
    });

    suite("_obtenerProductosDeFactura()", function () {
        test("Camino bueno (Intento 1): debe obtener productos desde subrecurso factura/{id}/ordenproducto", function (done) {
            sandbox.stub(window, "fetch").resolves(
                new Response(JSON.stringify([
                    { idOrdenProducto: { idProducto: { idProducto: "p1", nombre: "Capuchino" }, precio: 3.25 } }
                ]), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Total-Records": "1" }
                })
            );

            cut._obtenerProductosDeFactura({ idFactura: "fac-1", observaciones: "" })
                .then(prods => {
                    chai.assert.lengthOf(prods, 1);
                    chai.assert.equal(prods[0].nombreProducto, "Capuchino");
                    chai.assert.equal(prods[0].precio, 3.25);
                    done();
                })
                .catch(done);
        });

        test("Camino respaldo (Intento 2): si subrecurso falla, debe buscar por sufijo de orden #XXXXX", function (done) {
            sandbox.stub(cut._ordenDAO, "findRange").resolves(
                crearDefaultResponse([{ idOrden: "orden-full-A1B2C" }], 1)
            );
            cut._mapaProductos.set("p9", "Té Chai");

            sandbox.stub(window, "fetch").callsFake((url) => {
                if (url.includes("factura/")) {
                    return Promise.resolve(new Response(null, { status: 404 }));
                }
                return Promise.resolve(
                    new Response(JSON.stringify([{ idProducto: "p9", precio: 2.75 }]), {
                        status: 200,
                        headers: { "Content-Type": "application/json", "Total-Records": "1" }
                    })
                );
            });

            cut._obtenerProductosDeFactura({ idFactura: "fac-2", observaciones: "Orden #A1B2C" })
                .then(prods => {
                    chai.assert.lengthOf(prods, 1);
                    chai.assert.equal(prods[0].nombreProducto, "Té Chai");
                    chai.assert.equal(prods[0].precio, 2.75);
                    done();
                })
                .catch(done);
        });

        test("Camino malo: debe retornar arreglo vacío [] si fallan ambos intentos", function (done) {
            sandbox.stub(window, "fetch").rejects(new Error("Sin red"));
            sandbox.stub(cut._ordenDAO, "findRange").rejects(new Error("Sin red"));

            cut._obtenerProductosDeFactura({ idFactura: "fac-3", observaciones: "Orden #ZZZZZ" })
                .then(prods => {
                    chai.assert.isArray(prods);
                    chai.assert.isEmpty(prods);
                    done();
                })
                .catch(done);
        });
    });

    suite("_mapearProductoOrden() y _extraerDatosClienteYOrden()", function () {
        test("Debe usar nombre de respaldo con últimos 5 caracteres si el producto no está en el mapa", function () {
            const res = cut._mapearProductoOrden({ idProducto: "prod-12345", precio: "4.5" });
            chai.assert.equal(res.nombreProducto, "Producto #12345");
            chai.assert.equal(res.precio, 4.5);
        });

        test("Debe asignar 'Consumidor Final' y orden sin idOrden cuando no hay datos en observaciones", function () {
            const res = cut._extraerDatosClienteYOrden({ cliente: "   ", observaciones: "" });
            chai.assert.equal(res.clienteNombre, "Consumidor Final");
            chai.assert.isUndefined(res.orden.idOrden);
        });
    });

    suite("construirDetalleTicket()", function () {
        test("Camino bueno con abonos reales y vuelto calculado", function (done) {
            sandbox.stub(cut, "_obtenerProductosDeFactura").resolves([
                { nombreProducto: "Latte", precio: 3.50 }
            ]);
            sandbox.stub(cut._pagoDAO, "findRange").resolves(
                crearDefaultResponse([{ idPago: "pag-1", idFactura: { idFactura: "f-1" } }], 1)
            );
            sandbox.stub(window, "fetch").resolves(
                new Response(JSON.stringify([
                    { tipoPago: "EFECTIVO", monto: 5.00, referenciaExterna: "Caja 1" }
                ]), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Total-Records": "1" }
                })
            );

            cut.construirDetalleTicket({
                idFactura: "f-1",
                cliente: "Elena",
                observaciones: "Orden #77777"
            })
            .then(ticket => {
                chai.assert.equal(ticket.totalPedido, 3.50);
                chai.assert.equal(ticket.totalPagado, 5.00);
                chai.assert.equal(ticket.vuelto, 1.50);
                chai.assert.equal(ticket.abonos[0].tipoPago, "EFECTIVO");
                done();
            })
            .catch(done);
        });

        test("Camino malo (sin productos ni pagos registrados): debe usar ítem y abono de respaldo", function (done) {
            sandbox.stub(cut, "_obtenerProductosDeFactura").resolves([]);
            sandbox.stub(cut._pagoDAO, "findRange").rejects(new Error("Fallo pagos"));

            cut.construirDetalleTicket({
                idFactura: "f-2",
                observaciones: "Consumo Especial"
            })
            .then(ticket => {
                chai.assert.equal(ticket.productos[0].nombreProducto, "Consumo Especial");
                chai.assert.equal(ticket.abonos[0].tipoPago, "PAGADO");
                chai.assert.equal(ticket.vuelto, 0);
                done();
            })
            .catch(done);
        });
    });
});

mocha.run();