import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import CajaDAO from "../../../../src/js/control/caja_dao.js";
import Caja from "../../../../src/js/entity/caja.js";

mocha.setup("tdd");
suite("CajaDAO Unit Test", function () {

    var cut;
    var stubFetch;

    setup(function () {
        cut = new CajaDAO();
    });

    teardown(function () {
        if (stubFetch) {
            stubFetch.restore();
            stubFetch = null;
        }
    });

    suite("Constructor", function () {
        test("Debe invocar a super() y concatenar 'caja/' a la URL base heredada", function () {
            chai.assert.isDefined(cut.URL);
            chai.assert.equal(cut.URL, `${cut.BASE_URL}caja/`);
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

            const caja = new Caja();
            caja.nombre = "Caja Principal";

            const resultado = cut.create(caja);

            chai.assert.equal(resultado, mockPromise);
            chai.assert.isTrue(stubFetch.calledOnce);
            chai.assert.isTrue(stubFetch.calledWithExactly(caja));
        });
    });

    suite("findById()", function () {
        test("Debe delegar la llamada a _findById y retornar su promesa", function () {
            const mockPromise = Promise.resolve("datos_findById");
            stubFetch = sinon.stub(cut, "_findById").returns(mockPromise);

            const idParam = "123";

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

            const idParam = "123";
            const caja = new Caja();
            caja.nombre = "Caja Secundaria";

            const resultado = cut.update(idParam, caja);

            chai.assert.equal(resultado, mockPromise);
            chai.assert.isTrue(stubFetch.calledOnce);
            chai.assert.isTrue(stubFetch.calledWithExactly(idParam, caja));
        });
    });

    suite("delete()", function () {
        test("Debe delegar la llamada a _delete y retornar su promesa", function () {
            const mockPromise = Promise.resolve("datos_delete");
            stubFetch = sinon.stub(cut, "_delete").returns(mockPromise);

            const idParam = "123";

            const resultado = cut.delete(idParam);

            chai.assert.equal(resultado, mockPromise);
            chai.assert.isTrue(stubFetch.calledOnce);
            chai.assert.isTrue(stubFetch.calledWithExactly(idParam));
        });
    });
});

mocha.run();