import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import FacturaOrdenProductoDAO from "../../../../src/js/control/factura_orden_producto_dao.js";
import FacturaOrdenProducto from "../../../../src/js/entity/factura_orden_producto.js";

mocha.setup("tdd");
suite("FacturaOrdenProductoDAO Unit Test", function () {

    var cut;
    var stubFetch;
    const idFacturaPrueba = "fac-123";

    setup(function () {
        cut = new FacturaOrdenProductoDAO(idFacturaPrueba);
    });

    teardown(function () {
        if (stubFetch) {
            stubFetch.restore();
            stubFetch = null;
        }
    });

    suite("Constructor", function () {
        test("Debe invocar a super() y concatenar 'factura/{idFactura}/ordenproducto/' a la URL base heredada", function () {
            chai.assert.isDefined(cut.URL);
            chai.assert.equal(cut.URL, `${cut.BASE_URL}factura/${idFacturaPrueba}/ordenproducto/`);
        });
    });

    suite("findRange()", function () {
        test("Debe delegar la llamada a _findRange y retornar su promesa", function () {
            const mockPromise = Promise.resolve("datos_findRange");
            stubFetch = sinon.stub(cut, "_findRange").returns(mockPromise);

            const firstParam = 0;
            const maxParam = 10;

            const resultado = cut.findRange(firstParam, maxParam);

            chai.assert.equal(resultado, mockPromise);
            chai.assert.isTrue(stubFetch.calledOnce);
            chai.assert.isTrue(stubFetch.calledWithExactly(firstParam, maxParam));
        });
    });

    suite("create()", function () {
        test("Debe delegar la llamada a _create y retornar su promesa", function () {
            const mockPromise = Promise.resolve("datos_create");
            stubFetch = sinon.stub(cut, "_create").returns(mockPromise);

            const facturaOrdenProducto = new FacturaOrdenProducto();
            facturaOrdenProducto.cantidad = 2;

            const resultado = cut.create(facturaOrdenProducto);

            chai.assert.equal(resultado, mockPromise);
            chai.assert.isTrue(stubFetch.calledOnce);
            chai.assert.isTrue(stubFetch.calledWithExactly(facturaOrdenProducto));
        });
    });

    suite("findById()", function () {
        test("Debe delegar la llamada a _findById y retornar su promesa", function () {
            const mockPromise = Promise.resolve("datos_findById");
            stubFetch = sinon.stub(cut, "_findById").returns(mockPromise);

            const idParam = "fop-456";

            const resultado = cut.findById(idParam);

            chai.assert.equal(resultado, mockPromise);
            chai.assert.isTrue(stubFetch.calledOnce);
            chai.assert.isTrue(stubFetch.calledWithExactly(idParam));
        });
    });

    suite("update()", function () {
        test("Debe delegar la llamada a _update y retornar su promesa", function () {
            const mockPromise = Promise.resolve("datos_update");
            stubFetch = sinon.stub(cut, "_update").returns(mockPromise);

            const idParam = "fop-456";
            const facturaOrdenProducto = new FacturaOrdenProducto();
            facturaOrdenProducto.cantidad = 5;

            const resultado = cut.update(idParam, facturaOrdenProducto);

            chai.assert.equal(resultado, mockPromise);
            chai.assert.isTrue(stubFetch.calledOnce);
            chai.assert.isTrue(stubFetch.calledWithExactly(idParam, facturaOrdenProducto));
        });
    });

    suite("delete()", function () {
        test("Debe delegar la llamada a _delete y retornar su promesa", function () {
            const mockPromise = Promise.resolve("datos_delete");
            stubFetch = sinon.stub(cut, "_delete").returns(mockPromise);

            const idParam = "fop-456";

            const resultado = cut.delete(idParam);

            chai.assert.equal(resultado, mockPromise);
            chai.assert.isTrue(stubFetch.calledOnce);
            chai.assert.isTrue(stubFetch.calledWithExactly(idParam));
        });
    });
});

mocha.run();