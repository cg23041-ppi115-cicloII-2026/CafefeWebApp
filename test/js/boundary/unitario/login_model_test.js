import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import LoginModel from "../../../../src/js/boundary/login_model.js";

mocha.setup("tdd");

function leerErrorLogin(comp) {
    return comp.error
        ?? comp._error
        ?? comp._mensajeError
        ?? comp.shadowRoot?.querySelector(".error, .mensaje-error, [role='alert']")?.textContent?.trim()
        ?? "";
}

suite("LoginModel Unit Test (Cobertura Completa)", function () {
    let cut;
    let sandbox;

    setup(function () {
        sandbox = sinon.createSandbox();
        cut = document.createElement("login-model");
        document.body.appendChild(cut);
    });

    teardown(function () {
        sandbox.restore();
        if (cut && cut.parentNode) {
            cut.parentNode.removeChild(cut);
        }
    });

    suite("connectedCallback() y _dibujar()", function () {
        test("Debe renderizar <login-cafefe> con el logo por defecto", function () {
            const comp = cut.root.querySelector("login-cafefe");
            chai.assert.isNotNull(comp);
            chai.assert.equal(comp.getAttribute("logo"), "./resources/img/logo_cafe.png");
        });

        test("Debe respetar el atributo 'logo' personalizado", function () {
            cut.setAttribute("logo", "./custom.png");
            cut._dibujar();
            const comp = cut.root.querySelector("login-cafefe");
            chai.assert.equal(comp.getAttribute("logo"), "./custom.png");
        });
    });

    suite("_redirigirSegunSesion()", function () {
        test("No debe hacer nada ni emitir eventos si la sesión es null o undefined", function () {
            const spyEvent = sandbox.spy(cut, "dispatchEvent");
            cut._redirigirSegunSesion(null);
            cut._redirigirSegunSesion(undefined);
            chai.assert.isFalse(spyEvent.called);
        });

        test("Debe despachar evento 'sesion-iniciada' con detail, bubbles y composed", function () {
            const eventos = [];
            cut.addEventListener("sesion-iniciada", e => eventos.push(e));

            const sesion = { modo: "CLIENTE" };
            cut._redirigirSegunSesion(sesion);

            chai.assert.lengthOf(eventos, 1);
            chai.assert.deepEqual(eventos[0].detail, sesion);
            chai.assert.isTrue(eventos[0].bubbles);
            chai.assert.isTrue(eventos[0].composed);
        });
    });

    suite("_procesarLoginEmpleado()", function () {
        test("Camino bueno: debe autenticar, guardar sesionActual, redirigir y apagar cargando", function (done) {
            sandbox.stub(cut, "_redirigirSegunSesion");
            const sesionFake = { modo: "EMPLEADO", nombre: "Ana", vistaInicial: "BARISTA" };
            const stubAuth = sandbox.stub(cut.sessionManager, "autenticarEmpleado").resolves(sesionFake);

            cut._procesarLoginEmpleado({ nombre: "Ana", idEmpleado: "E-01", recordar: true })
                .then(() => {
                    chai.assert.isTrue(stubAuth.calledOnceWithExactly("Ana", "E-01", true));
                    chai.assert.deepEqual(cut.sesionActual, sesionFake);
                    chai.assert.isTrue(cut._redirigirSegunSesion.calledOnceWithExactly(sesionFake));
                    chai.assert.isFalse(cut._loginComp.cargando);
                    chai.assert.equal(leerErrorLogin(cut._loginComp), "");
                    done();
                })
                .catch(done);
        });

        test("Camino malo (doble envío): debe ignorar la llamada si ya está cargando", function () {
            const stubAuth = sandbox.stub(cut.sessionManager, "autenticarEmpleado");
            cut._loginComp.cargando = true;

            cut._procesarLoginEmpleado({ nombre: "Ana", idEmpleado: "E-01", recordar: false });

            chai.assert.isFalse(stubAuth.called);
        });

        test("Camino malo (credenciales inválidas con mensaje): debe mostrar el error exacto y apagar cargando", function (done) {
            sandbox.stub(cut, "_redirigirSegunSesion");
            sandbox.stub(cut.sessionManager, "autenticarEmpleado")
                .rejects(new Error("Empleado no encontrado"));

            cut._procesarLoginEmpleado({ nombre: "Malo", idEmpleado: "999", recordar: false })
                .then(() => {
                    chai.assert.include(leerErrorLogin(cut._loginComp), "Empleado no encontrado");
                    chai.assert.isFalse(cut._loginComp.cargando);
                    chai.assert.isNull(cut.sesionActual);
                    chai.assert.isFalse(cut._redirigirSegunSesion.called);
                    done();
                })
                .catch(done);
        });

        test("Camino malo (rechazo sin mensaje): debe usar el mensaje de respaldo", function (done) {
            sandbox.stub(cut, "_redirigirSegunSesion");
            sandbox.stub(cut.sessionManager, "autenticarEmpleado").rejects({});

            cut._procesarLoginEmpleado({ nombre: "Malo", idEmpleado: "999", recordar: false })
                .then(() => {
                    chai.assert.include(leerErrorLogin(cut._loginComp), "No se pudieron validar las credenciales.");
                    chai.assert.isFalse(cut._loginComp.cargando);
                    done();
                })
                .catch(done);
        });
    });

    suite("_procesarAccesoCliente() y eventos DOM", function () {
        test("Debe iniciar modo cliente al recibir el evento 'acceso-cliente' del hijo", function () {
            sandbox.stub(cut, "_redirigirSegunSesion");
            const sesionCli = { modo: "CLIENTE" };
            sandbox.stub(cut.sessionManager, "iniciarModoCliente").returns(sesionCli);

            cut._loginComp.dispatchEvent(new CustomEvent("acceso-cliente"));

            chai.assert.deepEqual(cut.sesionActual, sesionCli);
            chai.assert.isTrue(cut._redirigirSegunSesion.calledOnceWithExactly(sesionCli));
        });

        test("Debe disparar _procesarLoginEmpleado al recibir 'intentar-login'", function () {
            const stubLogin = sandbox.stub(cut, "_procesarLoginEmpleado");
            const payload = { nombre: "Luis", idEmpleado: "E-02", recordar: false };

            cut._loginComp.dispatchEvent(new CustomEvent("intentar-login", { detail: payload }));

            chai.assert.isTrue(stubLogin.calledOnceWithExactly(payload));
        });
    });
});

mocha.run();