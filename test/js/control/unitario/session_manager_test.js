import * as chai from "../../lib/chai/index.js";
import sinon from "../../lib/sinon/sinon-esm.js";
import SessionManager from "../../../../src/js/control/session_manager.js";
import EmpleadoDAO from "../../../../src/js/control/empleado_dao.js";
import EmpleadoRolDAO from "../../../../src/js/control/empleado_rol_dao.js";

mocha.setup("tdd");
suite("SessionManager Unit Test", function () {
    const STORAGE_KEY = "cafefe_sesion_activa";
    let cut;
    let stubEmpleadoFindRange;
    let stubRolFindRange;
    let clock;

    setup(function () {
        sessionStorage.clear();
        localStorage.clear();
        cut = new SessionManager();
    });

    teardown(function () {
        if (stubEmpleadoFindRange) {
            stubEmpleadoFindRange.restore();
            stubEmpleadoFindRange = null;
        }
        if (stubRolFindRange) {
            stubRolFindRange.restore();
            stubRolFindRange = null;
        }
        if (clock) {
            clock.restore();
            clock = null;
        }
        sessionStorage.clear();
        localStorage.clear();
    });

    suite("Constructor", function () {
        test("Debe inicializar la instancia de EmpleadoDAO correctamente", function () {
            chai.assert.isDefined(cut.empleadoDAO);
            chai.assert.instanceOf(cut.empleadoDAO, EmpleadoDAO);
        });
    });

    suite("clasificarCargo()", function () {
        test("Debe clasificar como GERENTE cuando el rol contiene Gerente, Admin o Encargado (ignorando tildes y mayúsculas)", function () {
            chai.assert.equal(SessionManager.clasificarCargo("Gerente General"), "GERENTE");
            chai.assert.equal(SessionManager.clasificarCargo("  administrador  "), "GERENTE");
            chai.assert.equal(SessionManager.clasificarCargo("Encargado de Turno"), "GERENTE");
        });

        test("Debe clasificar como CAJERO cuando el rol contiene Cajero, TPV o Pago", function () {
            chai.assert.equal(SessionManager.clasificarCargo("Cajero"), "CAJERO");
            chai.assert.equal(SessionManager.clasificarCargo("Operador TPV"), "CAJERO");
            chai.assert.equal(SessionManager.clasificarCargo("Cobros y Pagos"), "CAJERO");
        });

        test("Debe clasificar como BARISTA para roles de preparación o cualquier otro rol desconocido", function () {
            chai.assert.equal(SessionManager.clasificarCargo("Barista"), "BARISTA");
            chai.assert.equal(SessionManager.clasificarCargo("Cocinero"), "BARISTA");
            chai.assert.equal(SessionManager.clasificarCargo("Preparador"), "BARISTA");
            chai.assert.equal(SessionManager.clasificarCargo("Mesero"), "BARISTA");
            chai.assert.equal(SessionManager.clasificarCargo(""), "BARISTA");
            chai.assert.equal(SessionManager.clasificarCargo(), "BARISTA");
        });
    });

    suite("autenticarEmpleado()", function () {
        test("Debe rechazar si el nombre o el UUID están vacíos o solo contienen espacios", async function () {
            try {
                await cut.autenticarEmpleado("", "uuid-123");
                chai.assert.fail("Se esperaba error por nombre vacío");
            } catch (error) {
                chai.assert.include(error.message, "Debes ingresar tanto tu nombre como tu identificador único");
            }

            try {
                await cut.autenticarEmpleado("Ana", "   ");
                chai.assert.fail("Se esperaba error por UUID vacío");
            } catch (error) {
                chai.assert.include(error.message, "Debes ingresar tanto tu nombre como tu identificador único");
            }
        });

        test("Debe rechazar cuando ningún empleado coincide con el nombre y UUID ingresados", async function () {
            const mockEmpleados = [
                { idEmpleado: "uuid-111", nombre: "Carlos", apellido: "Pérez", activo: true }
            ];
            stubEmpleadoFindRange = sinon
                .stub(cut.empleadoDAO, "findRange")
                .resolves({ datos: mockEmpleados, total_datos: 1 });

            try {
                await cut.autenticarEmpleado("María", "uuid-111");
                chai.assert.fail("Se esperaba error de credenciales no coincidentes");
            } catch (error) {
                chai.assert.include(error.message, "no coinciden con ningún empleado");
            }
        });

        test("Debe rechazar cuando el empleado existe pero se encuentra inactivo", async function () {
            const mockEmpleados = [
                { idEmpleado: "uuid-222", nombre: "Luis", apellido: "Gómez", activo: false }
            ];
            stubEmpleadoFindRange = sinon
                .stub(cut.empleadoDAO, "findRange")
                .resolves({ datos: mockEmpleados, total_datos: 1 });

            try {
                await cut.autenticarEmpleado("Luis", "uuid-222");
                chai.assert.fail("Se esperaba error por empleado inactivo");
            } catch (error) {
                chai.assert.include(error.message, "inactivo en el sistema");
            }
        });

        test("Debe rechazar cuando el empleado no tiene ningún cargo activo asignado", async function () {
            const mockEmpleados = [
                { idEmpleado: "uuid-333", nombre: "Sofía", apellido: "Ruiz", activo: true }
            ];
            const mockRoles = [
                { idEmpleadoRol: 10, idRol: { idRol: 1, nombre: "Barista" }, activo: false }
            ];

            stubEmpleadoFindRange = sinon
                .stub(cut.empleadoDAO, "findRange")
                .resolves({ datos: mockEmpleados, total_datos: 1 });
            stubRolFindRange = sinon
                .stub(EmpleadoRolDAO.prototype, "findRange")
                .resolves({ datos: mockRoles, total_datos: 1 });

            try {
                await cut.autenticarEmpleado("Sofía Ruiz", "UUID-333");
                chai.assert.fail("Se esperaba error por falta de roles activos");
            } catch (error) {
                chai.assert.include(error.message, "no tiene ningún cargo activo asignado");
            }
        });

        test("Debe autenticar correctamente, priorizar vistaInicial (GERENTE > CAJERO > BARISTA) y guardar sesión en sessionStorage", async function () {
            clock = sinon.useFakeTimers({ now: 1700000000000 });

            const mockEmpleados = [
                { idEmpleado: "uuid-444", nombre: "Elena", apellido: "Méndez", activo: true }
            ];
            const mockRoles = [
                { idEmpleadoRol: 20, idRol: { idRol: 2, nombre: "Barista" }, activo: true },
                { idEmpleadoRol: 21, idRol: { idRol: 1, nombre: "Gerente" }, activo: true }
            ];

            stubEmpleadoFindRange = sinon
                .stub(cut.empleadoDAO, "findRange")
                .resolves({ datos: mockEmpleados, total_datos: 1 });
            stubRolFindRange = sinon
                .stub(EmpleadoRolDAO.prototype, "findRange")
                .resolves({ datos: mockRoles, total_datos: 2 });

            const sesion = await cut.autenticarEmpleado("  elena  ", "  UUID-444 ", false);

            chai.assert.equal(sesion.modo, "EMPLEADO");
            chai.assert.equal(sesion.idEmpleado, "uuid-444");
            chai.assert.equal(sesion.nombreCompleto, "Elena Méndez");
            chai.assert.equal(sesion.vistaInicial, "GERENTE");
            chai.assert.equal(sesion.idEmpleadoRolPrincipal, 20);
            chai.assert.lengthOf(sesion.roles, 2);
            chai.assert.equal(sesion.expiraEn, 1700000000000 + 8 * 60 * 60 * 1000);

            chai.assert.isNotNull(sessionStorage.getItem(STORAGE_KEY));
            chai.assert.isNull(localStorage.getItem(STORAGE_KEY));
        });

        test("Debe asignar vistaInicial CAJERO y guardar en localStorage cuando recordar = true", async function () {
            const mockEmpleados = [
                { idEmpleado: "uuid-555", nombre: "Mario", activo: true }
            ];
            const mockRoles = [
                { idEmpleadoRol: 30, nombreRol: "Cajero Principal", activo: true }
            ];

            stubEmpleadoFindRange = sinon
                .stub(cut.empleadoDAO, "findRange")
                .resolves(mockEmpleados);
            stubRolFindRange = sinon
                .stub(EmpleadoRolDAO.prototype, "findRange")
                .resolves(mockRoles);

            const sesion = await cut.autenticarEmpleado("Mario", "uuid-555", true);

            chai.assert.equal(sesion.vistaInicial, "CAJERO");
            chai.assert.isNotNull(sessionStorage.getItem(STORAGE_KEY));
            chai.assert.isNotNull(localStorage.getItem(STORAGE_KEY));
        });
    });

    suite("iniciarModoCliente()", function () {
        test("Debe crear y guardar una sesión en modo CLIENTE con vistaInicial PEDIDO", function () {
            const sesionCliente = cut.iniciarModoCliente("  Juan Pérez  ");

            chai.assert.equal(sesionCliente.modo, "CLIENTE");
            chai.assert.equal(sesionCliente.nombreCliente, "Juan Pérez");
            chai.assert.equal(sesionCliente.vistaInicial, "PEDIDO");
            chai.assert.isNumber(sesionCliente.expiraEn);

            chai.assert.isNotNull(sessionStorage.getItem(STORAGE_KEY));
            chai.assert.isNull(localStorage.getItem(STORAGE_KEY));
        });
    });

    suite("guardarSesion(), obtenerSesion() y cerrarSesion()", function () {
        test("Debe retornar null cuando no existe ninguna sesión guardada", function () {
            chai.assert.isNull(cut.obtenerSesion());
        });

        test("Debe limpiar sesión previa antes de guardar una nueva", function () {
            cut.guardarSesion({ modo: "EMPLEADO", expiraEn: Date.now() + 10000 }, true);
            chai.assert.isNotNull(localStorage.getItem(STORAGE_KEY));

            cut.guardarSesion({ modo: "CLIENTE", expiraEn: Date.now() + 10000 }, false);
            chai.assert.isNull(localStorage.getItem(STORAGE_KEY));
            chai.assert.equal(cut.obtenerSesion().modo, "CLIENTE");
        });

        test("Debe recuperar sesión desde localStorage si sessionStorage está vacío", function () {
            const sesionGuardada = { modo: "EMPLEADO", nombre: "Ana", expiraEn: Date.now() + 60000 };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sesionGuardada));

            const recuperada = cut.obtenerSesion();
            chai.assert.deepEqual(recuperada, sesionGuardada);
        });

        test("Debe cerrar automáticamente y retornar null si la sesión ya expiró (pasadas 8 horas)", function () {
            clock = sinon.useFakeTimers({ now: 1700000000000 });
            cut.iniciarModoCliente("Cliente Temporal");

            chai.assert.isNotNull(cut.obtenerSesion());

            clock.tick(8 * 60 * 60 * 1000 + 1);

            chai.assert.isNull(cut.obtenerSesion());
            chai.assert.isNull(sessionStorage.getItem(STORAGE_KEY));
            chai.assert.isNull(localStorage.getItem(STORAGE_KEY));
        });

        test("Debe cerrar sesión y retornar null si el JSON almacenado está corrupto o no tiene expiraEn", function () {
            sessionStorage.setItem(STORAGE_KEY, "{json_invalido");
            chai.assert.isNull(cut.obtenerSesion());
            chai.assert.isNull(sessionStorage.getItem(STORAGE_KEY));

            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ modo: "EMPLEADO" }));
            chai.assert.isNull(cut.obtenerSesion());
            chai.assert.isNull(sessionStorage.getItem(STORAGE_KEY));
        });

        test("cerrarSesion() debe eliminar la clave tanto de sessionStorage como de localStorage", function () {
            cut.guardarSesion({ modo: "EMPLEADO", expiraEn: Date.now() + 60000 }, true);
            chai.assert.isNotNull(sessionStorage.getItem(STORAGE_KEY));
            chai.assert.isNotNull(localStorage.getItem(STORAGE_KEY));

            cut.cerrarSesion();

            chai.assert.isNull(sessionStorage.getItem(STORAGE_KEY));
            chai.assert.isNull(localStorage.getItem(STORAGE_KEY));
            chai.assert.isNull(cut.obtenerSesion());
        });
        test("Debe propagar el error cuando falla la consulta al DAO (error de red)", async function () {
            const errorRed = new Error("Error de conexión con el servidor");
            stubEmpleadoFindRange = sinon
                .stub(cut.empleadoDAO, "findRange")
                .rejects(errorRed);

            try {
                await cut.autenticarEmpleado("Elena", "uuid-444");
                chai.assert.fail("Se esperaba que propagara el error de red");
            } catch (error) {
                chai.assert.equal(error, errorRed);
            }
        });
    });
});

mocha.run();