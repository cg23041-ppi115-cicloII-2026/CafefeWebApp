import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import PedidoModel from "../../../../src/js/boundary/pedido_model.js";
import DefaultResponse from "../../../../src/js/entity/default_response.js";

mocha.setup("tdd");

function crearDefaultResponse(datos, total = 0) {
    const resp = new DefaultResponse();
    resp.datos = datos;
    resp.total_datos = String(total);
    return resp;
}

suite("PedidoModel Unit Test (Cobertura Completa)", function () {
    let cut;
    let sandbox;

    setup(function () {
        sandbox = sinon.createSandbox();
        cut = new PedidoModel();
        sandbox.stub(cut, "connectedCallback");
        document.body.appendChild(cut);
        cut.cargando = false;
        cut._dibujar();
    });

    teardown(function () {
        sandbox.restore();
        if (cut && cut.parentNode) {
            cut.parentNode.removeChild(cut);
        }
    });

    suite("_estaVigente()", function () {
        const ref = new Date("2026-11-20T12:00:00Z");

        test("Camino bueno: debe retornar true si está dentro del rango o sin fechas", function () {
            chai.assert.isTrue(cut._estaVigente(null, null, ref));
            chai.assert.isTrue(cut._estaVigente("2026-11-01T00:00:00Z", "2026-11-30T23:59:59Z", ref));
        });

        test("Camino malo: debe retornar false si aún no inicia o ya expiró", function () {
            chai.assert.isFalse(cut._estaVigente("2026-12-01T00:00:00Z", null, ref));
            chai.assert.isFalse(cut._estaVigente(null, "2026-11-10T00:00:00Z", ref));
        });
    });

    suite("_cargarMapaDescuentosVigentes()", function () {
        test("Camino bueno: debe respetar descuentoMaximo del tipo de descuento", function (done) {
            sandbox.stub(cut.tipoDescuentoDAO, "findRange").resolves(
                crearDefaultResponse([{ idTipoDescuento: "td1", nombre: "Promo", descuentoMaximo: 20, activo: true }], 1)
            );
            sandbox.stub(cut.descuentoDAO, "findRange").resolves(
                crearDefaultResponse([{ idDescuento: "d1", idTipoDescuento: "td1", nombre: "Black Friday" }], 1)
            );
            sandbox.stub(window, "fetch").resolves(
                new Response(JSON.stringify([{ idProducto: "p1", valor: 50 }]), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Total-Records": "1" }
                })
            );

            cut._cargarMapaDescuentosVigentes()
                .then(mapa => {
                    chai.assert.isTrue(mapa.has("p1"));
                    chai.assert.equal(mapa.get("p1").porcentaje, 20);
                    done();
                })
                .catch(done);
        });

        test("Camino malo: debe devolver Map vacío si fallan los DAOs de descuento", function (done) {
            sandbox.stub(cut.tipoDescuentoDAO, "findRange").rejects(new Error("Fallo"));
            sandbox.stub(cut.descuentoDAO, "findRange").rejects(new Error("Fallo"));

            cut._cargarMapaDescuentosVigentes()
                .then(mapa => {
                    chai.assert.instanceOf(mapa, Map);
                    chai.assert.equal(mapa.size, 0);
                    done();
                })
                .catch(done);
        });
    });

    suite("_cargarDatosDesdeAPI()", function () {
        test("Camino bueno: debe agrupar subcategorías de Bebidas y aplicar descuentos", function (done) {
            sandbox.stub(cut.tipoProductoDAO, "findRange").resolves(
                crearDefaultResponse([
                    { idTipoProducto: "cat-beb", nombre: "Bebidas", activo: true },
                    { idTipoProducto: "cat-fria", nombre: "Bebidas Frías", activo: true }
                ], 2)
            );
            sandbox.stub(cut.productoDAO, "findRange").resolves(
                crearDefaultResponse([
                    { idProducto: "p1", nombre: "Frappé", precioSugerido: 5.00, activo: true }
                ], 1)
            );
            sandbox.stub(cut.caracteristicaDAO, "findRange").resolves(crearDefaultResponse([], 0));
            sandbox.stub(cut.tipoCaracteristicaDAO, "findRange").resolves(crearDefaultResponse([], 0));

            const mapaDesc = new Map([["p1", { nombreDescuento: "2x1", porcentaje: 10 }]]);
            sandbox.stub(cut, "_cargarMapaDescuentosVigentes").resolves(mapaDesc);

            sandbox.stub(window, "fetch").resolves(
                new Response(JSON.stringify([{ idTipoProducto: "cat-fria" }]), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Total-Records": "1" }
                })
            );

            cut._cargarDatosDesdeAPI()
                .then(() => {
                    chai.assert.isFalse(cut.cargando);
                    chai.assert.lengthOf(cut.categorias, 1);
                    chai.assert.equal(cut.productos[0].idTipoProducto, "cat-beb");
                    chai.assert.equal(cut.productos[0].subcategoria, "Bebidas Frías");
                    chai.assert.equal(cut.productos[0].precioSugerido, 4.50);
                    done();
                })
                .catch(done);
        });

        test("Camino malo: debe mostrar <mensaje-error> y apagar cargando si falla la API principal", function (done) {
            sandbox.stub(cut.tipoProductoDAO, "findRange").rejects({ mensaje: "Servidor caído" });
            sandbox.stub(cut.productoDAO, "findRange").resolves(crearDefaultResponse([], 0));
            sandbox.stub(cut.caracteristicaDAO, "findRange").resolves(crearDefaultResponse([], 0));
            sandbox.stub(cut.tipoCaracteristicaDAO, "findRange").resolves(crearDefaultResponse([], 0));
            sandbox.stub(cut, "_cargarMapaDescuentosVigentes").resolves(new Map());

            cut._cargarDatosDesdeAPI()
                .then(() => {
                    chai.assert.isFalse(cut.cargando);
                    const alerta = cut.root.querySelector("mensaje-error");
                    chai.assert.isNotNull(alerta);
                    const tituloRenderizado = alerta._titulo || alerta.shadowRoot?.querySelector(".titulo, h3, strong")?.textContent || "";
                    chai.assert.include(tituloRenderizado, "No se pudo cargar el menú");
                    done();
                })
                .catch(done);
        });
    });

    suite("_abrirDetalleProducto()", function () {
        test("Camino bueno: debe agrupar opciones por tipo de característica y pasar al paso 3", function (done) {
            cut.tiposCaracteristica = [{ idTipoCaracteristica: "tc1", nombre: "Tamaño" }];
            cut.caracteristicas = [{ idCaracteristica: "c1", nombre: "Grande", idTipoCaracteristica: "tc1" }];

            sandbox.stub(window, "fetch").resolves(
                new Response(JSON.stringify([{ idCaracteristica: "c1", valor: "16 oz" }]), {
                    status: 200,
                    headers: { "Content-Type": "application/json", "Total-Records": "1" }
                })
            );

            cut._abrirDetalleProducto({ idProducto: "p1", nombre: "Latte" })
                .then(() => {
                    chai.assert.equal(cut.pasoActual, 3);
                    chai.assert.lengthOf(cut.gruposCaracteristicasProducto, 1);
                    chai.assert.equal(cut.gruposCaracteristicasProducto[0].nombre, "Tamaño");
                    chai.assert.equal(cut.gruposCaracteristicasProducto[0].opciones[0].etiqueta, "Grande (16 oz)");
                    done();
                })
                .catch(done);
        });

        test("Camino malo: si falla la carga de características, deja grupos vacíos sin bloquear vista", function (done) {
            sandbox.stub(window, "fetch").rejects(new Error("404"));

            cut._abrirDetalleProducto({ idProducto: "p1", nombre: "Latte" })
                .then(() => {
                    chai.assert.equal(cut.pasoActual, 3);
                    chai.assert.isEmpty(cut.gruposCaracteristicasProducto);
                    done();
                })
                .catch(done);
        });
    });

    suite("_confirmarYEnviarOrden()", function () {
        test("Camino bueno: debe crear orden, enviar ítems y pasar al paso 5", function (done) {
            sandbox.stub(cut, "_obtenerIdEmpleadoRolPorDefecto").resolves("er-1");
            sandbox.stub(cut.ordenDAO, "create").resolves(crearDefaultResponse({ id: "ord-99999999" }, 1));
            const stubFetch = sandbox.stub(window, "fetch").resolves(
                new Response(null, { status: 201, headers: { Location: "/orden/ord-99999999/producto/1" } })
            );

            cut.carrito = [{ idProducto: "p1", nombre: "Café", precio: 2.0, cantidad: 2 }];

            cut._confirmarYEnviarOrden({ items: cut.carrito, nombreCliente: "Tania" })
                .then(() => {
                    chai.assert.equal(cut.pasoActual, 5);
                    chai.assert.isEmpty(cut.carrito);
                    chai.assert.isFalse(cut._enviandoOrden);
                    chai.assert.equal(stubFetch.callCount, 2);
                    done();
                })
                .catch(done);
        });

        test("Camino malo (sin EmpleadoRol activo): debe mostrar error y mantener carrito", function (done) {
            sandbox.stub(cut, "_obtenerIdEmpleadoRolPorDefecto").resolves(null);
            cut.carrito = [{ idProducto: "p1", nombre: "Café", precio: 2.0, cantidad: 1 }];

            cut._confirmarYEnviarOrden({ items: cut.carrito, nombreCliente: "Tania" })
                .then(() => {
                    chai.assert.notEqual(cut.pasoActual, 5);
                    chai.assert.lengthOf(cut.carrito, 1);
                    chai.assert.isFalse(cut._enviandoOrden);
                    const alerta = cut.root.querySelector("mensaje-error");
                    chai.assert.isNotNull(alerta);
                    done();
                })
                .catch(done);
        });

        test("Camino malo (orden creada sin header Location): debe mostrar error controlado", function (done) {
            sandbox.stub(cut, "_obtenerIdEmpleadoRolPorDefecto").resolves("er-1");
            sandbox.stub(cut.ordenDAO, "create").resolves(crearDefaultResponse({ id: null }, 1));

            cut._confirmarYEnviarOrden({
                items: [{ idProducto: "p1", nombre: "Café", precio: 2.0, cantidad: 1 }],
                nombreCliente: ""
            })
            .then(() => {
                chai.assert.isFalse(cut._enviandoOrden);
                const alerta = cut.root.querySelector("mensaje-error");
                chai.assert.isNotNull(alerta);
                const detalleError = alerta.error?.mensaje || alerta.mensaje || alerta.shadowRoot?.textContent || "";
                chai.assert.include(detalleError, "Location");
                done();
            })
            .catch(done);
        });
    });
});

mocha.run();