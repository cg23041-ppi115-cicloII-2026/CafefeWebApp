import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import OrdenModel from "../../../../src/js/boundary/orden_model.js";
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

suite("OrdenModel Unit Test (Cobertura Completa)", function () {
    let cut;
    let sandbox;

    setup(function () {
        sandbox = sinon.createSandbox();
        cut = new OrdenModel();
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

    suite("Utilidades de fechas, estados y observaciones", function () {
        test("Debe parsear fechas en formato Array de Java LocalDateTime y String ISO", function () {
            const hoy = new Date();
            const arrFecha = [hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate(), 10, 30, 0];
            chai.assert.isTrue(cut._esDeHoy(arrFecha));
            chai.assert.isFalse(cut._esDeHoy("1999-01-01T00:00:00Z"));
            chai.assert.isFalse(cut._esDeHoy(null));
        });

        test("Debe construir observaciones limpiando estados anteriores", function () {
            const devuelta = cut._construirObservacion("Sin azúcar | Preparandose", "Devuelto a cola");
            chai.assert.equal(devuelta, "Sin azúcar | Devuelto a cola");

            const reabierta = cut._construirObservacion("Sin azúcar | Entregado 10:00", "Reabierto");
            chai.assert.equal(reabierta, "Sin azúcar");
        });
    });

    suite("_cargarCatalogoProductos()", function () {
        test("Camino bueno: debe poblar _mapaProductos", function (done) {
            sandbox.stub(cut._productoDAO, "findRange").resolves(
                crearDefaultResponse([{ idProducto: "p1", nombre: "Americano" }], 1)
            );

            cut._cargarCatalogoProductos()
                .then(() => {
                    chai.assert.equal(cut._mapaProductos.get("p1"), "Americano");
                    done();
                })
                .catch(done);
        });

        test("Camino malo: debe mostrar advertencia si falla el catálogo", function (done) {
            sandbox.stub(cut._productoDAO, "findRange").rejects(new Error("Timeout"));

            cut._cargarCatalogoProductos()
                .then(() => {
                    const alerta = cut._root.querySelector("mensaje-error");
                    chai.assert.isNotNull(alerta);
                    chai.assert.include(leerTituloAlerta(alerta), "Advertencia");
                    done();
                })
                .catch(done);
        });
    });

    suite("_cargarOrdenes()", function () {
        test("Camino bueno: debe clasificar pendientes, enProceso, listas e ignorar entregadas/pagadas", function (done) {
            sandbox.stub(cut._ordenDAO, "findRange").resolves(
                crearDefaultResponse([
                    { idOrden: "ord-00001", fechaCreacion: "2026-11-20T08:00:00Z" },
                    { idOrden: "ord-00002", fechaCreacion: "2026-11-20T08:05:00Z" },
                    { idOrden: "ord-00003", fechaCreacion: "2026-11-20T08:10:00Z" },
                    { idOrden: "ord-00004", fechaCreacion: "2026-11-20T08:15:00Z" },
                    { idOrden: "ord-PAGAD", fechaCreacion: "2026-11-20T08:20:00Z" }
                ], 5)
            );
            sandbox.stub(cut, "_obtenerCodigosOrdenesPagadas").resolves(new Set(["PAGAD"]));

            sandbox.stub(window, "fetch").callsFake(url => {
                const headers = { "Content-Type": "application/json", "Total-Records": "1" };
                if (url.includes("ord-00001")) return Promise.resolve(new Response(JSON.stringify([{ idOrdenProducto: "1", idProducto: "p1", observaciones: "" }]), { status: 200, headers }));
                if (url.includes("ord-00002")) return Promise.resolve(new Response(JSON.stringify([{ idOrdenProducto: "2", idProducto: "p1", observaciones: "Preparandose" }]), { status: 200, headers }));
                if (url.includes("ord-00003")) return Promise.resolve(new Response(JSON.stringify([{ idOrdenProducto: "3", idProducto: "p1", observaciones: "Listo" }]), { status: 200, headers }));
                return Promise.resolve(new Response(JSON.stringify([{ idOrdenProducto: "4", idProducto: "p1", observaciones: "Entregado 09:00" }]), { status: 200, headers }));
            });

            cut._cargarOrdenes()
                .then(() => {
                    chai.assert.lengthOf(cut._pendientes, 1);
                    chai.assert.equal(cut._enProceso.orden.idOrden, "ord-00002");
                    chai.assert.lengthOf(cut._listas, 1);
                    done();
                })
                .catch(done);
        });

        test("Camino malo: debe mostrar error en UI si falla _ordenDAO.findRange", function (done) {
            sandbox.stub(cut._ordenDAO, "findRange").rejects(new Error("Error de conexión"));
            sandbox.stub(cut, "_obtenerCodigosOrdenesPagadas").resolves(new Set());

            cut._cargarOrdenes()
                .then(() => {
                    const alerta = cut._root.querySelector("mensaje-error");
                    chai.assert.isNotNull(alerta);
                    chai.assert.include(leerTituloAlerta(alerta), "No se pudo cargar la cola de órdenes");
                    done();
                })
                .catch(done);
        });
    });

    suite("Transiciones de estado (_tomarOrden, _completarOrden, _entregarOrden, _cancelarOrdenConMotivo, _reabrirOrden)", function () {
        test("Camino malo (_tomarOrden): debe impedir tomar orden si la estación ya está ocupada", function () {
            cut._enProceso = { orden: { idOrden: "ord-activa" }, productos: [] };
            cut._tomarOrden({ idOrden: "ord-otra" });

            const alerta = cut._root.querySelector("mensaje-error");
            chai.assert.isNotNull(alerta);
            chai.assert.include(leerTituloAlerta(alerta), "Estación ocupada");
        });

        test("Camino bueno: flujo completo _completarOrden -> _entregarOrden", function () {
            sandbox.stub(cut, "_actualizarProductosBD").resolves();
            const orden = { idOrden: "ord-10" };
            cut._enProceso = { orden, productos: [{ idOrdenProducto: "op1", observaciones: "" }] };

            cut._completarOrden(orden);
            chai.assert.isNull(cut._enProceso);
            chai.assert.lengthOf(cut._listas, 1);

            cut._entregarOrden(orden);
            chai.assert.isEmpty(cut._listas);
        });

        test("Camino malo (_reabrirOrden): no debe reabrir una orden que ya está pagada", function () {
            const spyUpdate = sandbox.spy(cut, "_actualizarProductosBD");
            cut._reabrirOrden({ orden: { idOrden: "ord-1" }, productos: [], pagada: true });
            chai.assert.isFalse(spyUpdate.called);
        });
    });
});

mocha.run();