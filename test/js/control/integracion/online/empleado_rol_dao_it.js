import * as chai from "../../../lib/chai/index.js";
import EmpleadoRolDAO from "../../../../../src/js/control/empleado_rol_dao.js";
import EmpleadoDAO from "../../../../../src/js/control/empleado_dao.js";
import RolDAO from "../../../../../src/js/control/rol_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import EmpleadoRol from "../../../../../src/js/entity/empleado_rol.js";
import Empleado from "../../../../../src/js/entity/empleado.js";
import Rol from "../../../../../src/js/entity/rol.js";

mocha.setup("bdd");

describe("EmpleadoRolDAO Integration Tests - Online", function () {
  let cut;
  let empleadoDAO;
  let rolDAO;

  let idEmpleadoCreado;
  let idRolCreado;
  let idEmpleadoRolCreado;

  let empleadoRolBase;

  before(function (done) {
    empleadoDAO = new EmpleadoDAO();
    rolDAO = new RolDAO();

    const ts = Date.now();
    let pasoActual = "Crear Empleado";

    const empleado = new Empleado();
    empleado.nombre = "Empleado_IT_" + ts.toString().slice(-4);
    empleado.apellido = "Prueba";
    empleado.activo = true;

    empleadoDAO
      .create(empleado)
      .then((resEmp) => {
        pasoActual = "Crear Rol";
        idEmpleadoCreado = resEmp.datos.id;

        const rol = new Rol();
        rol.nombre = "ROL_IT_" + ts.toString().slice(-4);
        rol.activo = true;

        return rolDAO.create(rol);
      })
      .then((resRol) => {
        pasoActual = "Configurar EmpleadoRolDAO y registro base";
        idRolCreado = resRol.datos.id;

        // Instanciamos el DAO inyectando el idEmpleado en la ruta
        cut = new EmpleadoRolDAO(idEmpleadoCreado);

        empleadoRolBase = new EmpleadoRol();
        empleadoRolBase.idEmpleado = { idEmpleado: idEmpleadoCreado };
        empleadoRolBase.idRol = { idRol: idRolCreado };
        empleadoRolBase.activo = true;
        empleadoRolBase.observaciones = "Asignación inicial de prueba";

        done();
      })
      .catch((err) => {
        const msg = err.mensaje || JSON.stringify(err);
        done(new Error(`Falló en el paso [${pasoActual}]: ${msg}`));
      });
  });

  after(function (done) {
    let pLimpieza = (idEmpleadoRolCreado && cut)
      ? cut.delete(idEmpleadoRolCreado).catch(() => true)
      : Promise.resolve();

    pLimpieza
      .then(() => (idRolCreado && rolDAO) 
        ? rolDAO.delete(idRolCreado).catch(() => true) 
        : Promise.resolve())
      .then(() => (idEmpleadoCreado && empleadoDAO) 
        ? empleadoDAO.delete(idEmpleadoCreado).catch(() => true) 
        : Promise.resolve())
      .then(() => done())
      .catch(done);
  });

  it("Debe crear una instancia de EmpleadoRolDAO", function () {
    chai.expect(cut).to.be.an.instanceOf(EmpleadoRolDAO);
  });

  // ==========================================
  // Método Create
  // ==========================================
  describe("Method: create()", function () {
    it("Debe retornar un DefaultResponse y estado 201 al crear el empleado_rol", function (done) {
      cut
        .create(empleadoRolBase)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("id");
          chai.expect(response.datos).to.have.property("location");
          chai.expect(response.datos.id).to.exist;
          chai.expect(response.datos.location).to.exist;
          
          idEmpleadoRolCreado = response.datos.id;
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });

    it("Debe rechazar con error (400) cuando falta el idRol en la solicitud", function (done) {
      const mapeoInvalido = new EmpleadoRol();
      mapeoInvalido.idEmpleado = { idEmpleado: idEmpleadoCreado };

      cut
        .create(mapeoInvalido)
        .then(() => done(new Error("La creación debió fallar por idRol nulo")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });

    it("Debe rechazar con error (404) cuando se envía un idRol inexistente", function (done) {
      const rolFalso = new EmpleadoRol();
      rolFalso.idEmpleado = { idEmpleado: idEmpleadoCreado };
      rolFalso.idRol = { idRol: "123e4567-e89b-12d3-a456-426614174000" };

      cut
        .create(rolFalso)
        .then(() => done(new Error("La creación debió fallar por Rol no encontrado")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.include("Error al crear los datos: 404");
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });

    it("Debe rechazar cuando se envía la entidad con un ID asignado (400 o 422)", function (done) {
      const mapeoConId = new EmpleadoRol();
      mapeoConId.idEmpleadoRol = "123e4567-e89b-12d3-a456-426614174000";
      mapeoConId.idEmpleado = { idEmpleado: idEmpleadoCreado };
      mapeoConId.idRol = { idRol: idRolCreado };

      cut
        .create(mapeoConId)
        .then(() => done(new Error("La creación debió fallar")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.match(/Error al crear los datos: (400|422)/);
          done();
        })
        .catch(done);
    });
  });

  // ==========================================
  // Método FindRange
  // ==========================================
  describe("Method: findRange()", function () {
    it("Debe retornar un DefaultResponse con un array de roles asignados al empleado", function (done) {
      cut
        .findRange(0, 10)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("array");
          chai.expect(response).to.have.property("total_datos");
          if (response.total_datos !== null) {
            chai.expect(response.total_datos).to.be.a("string");
          }
          chai.expect(response.datos.length).to.be.above(0);
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });

    it("Debe rechazar si se mandan parámetros de paginación inválidos (400)", function (done) {
      cut
        .findRange(-1, -5)
        .then(() => done(new Error("La consulta debió fallar")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.include("Error al obtener los datos: 400");
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });

    it("Debe rechazar con error de parseo al leer un JSON corrupto del servidor", function (done) {
      const originalJson = Response.prototype.json;
      Response.prototype.json = function () {
        return Promise.reject(new Error("Simulado: JSON corrupto en listar roles"));
      };

      cut
        .findRange(0, 10)
        .then(() => {
          Response.prototype.json = originalJson;
          done(new Error("La consulta debería haber fallado por error de parseo"));
        })
        .catch((error) => {
          Response.prototype.json = originalJson;
          try {
            chai.expect(error).to.have.property("mensaje");
            chai.expect(error.mensaje).to.include("Error al parsear los datos: Simulado: JSON corrupto");
            done();
          } catch (assertError) {
            done(assertError);
          }
        });
    });
  });

  // ==========================================
  // Método FindById
  // ==========================================
  describe("Method: findById()", function () {
    it("Debe retornar el empleado_rol creado por su ID", function (done) {
      cut
        .findById(idEmpleadoRolCreado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("idEmpleadoRol");
          chai.expect(response.datos.idEmpleadoRol).to.equal(idEmpleadoRolCreado);
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });

    it("Debe rechazar si no se encuentra la asignación (404)", function (done) {
      cut
        .findById("123e4567-e89b-12d3-a456-426614174000")
        .then(() => done(new Error("La consulta debió fallar por no encontrado")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar si se manda un id de asignación inválido (404)", function (done) {
      cut
        .findById("id-invalido")
        .then(() => done(new Error("La consulta debió fallar")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar error al parsear los datos", function (done) {
      const originalJson = Response.prototype.json;
      Response.prototype.json = function () {
        return Promise.reject(new Error("Simulado: JSON corrupto"));
      };

      cut
        .findById(idEmpleadoRolCreado)
        .then(() => {
          Response.prototype.json = originalJson;
          done(new Error("La consulta debería haber fallado"));
        })
        .catch((error) => {
          Response.prototype.json = originalJson;
          try {
            chai.expect(error).to.have.property("mensaje");
            chai.expect(error.mensaje).to.include("Error al parsear los datos: Simulado: JSON corrupto");
            done();
          } catch (assertError) {
            done(assertError);
          }
        });
    });
  });

  // ==========================================
  // Método Update
  // ==========================================
  describe("Method: update()", function () {
    it("Debe actualizar la asignación empleado_rol creada (200)", function (done) {
      const empleadoRolActualizado = new EmpleadoRol();
      empleadoRolActualizado.idRol = { idRol: idRolCreado };
      empleadoRolActualizado.activo = false;
      empleadoRolActualizado.observaciones = "Asignación inhabilitada";

      cut
        .update(idEmpleadoRolCreado, empleadoRolActualizado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos.idEmpleadoRol).to.equal(idEmpleadoRolCreado);
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });

    it("Debe rechazar al intentar actualizar una asignación inexistente (404)", function (done) {
      const registroInexistente = new EmpleadoRol();
      registroInexistente.idRol = { idRol: idRolCreado };

      cut
        .update("123e4567-e89b-12d3-a456-426614174999", registroInexistente)
        .then(() => done(new Error("La actualización debió fallar por no encontrado")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.include("Error al modificar los datos: 404");
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });

    it("Debe rechazar al actualizar con un idRol nulo (400)", function (done) {
      const registroSinRol = new EmpleadoRol();
      registroSinRol.activo = true;

      cut
        .update(idEmpleadoRolCreado, registroSinRol)
        .then(() => done(new Error("La actualización debió fallar por idRol nulo")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.include("Error al modificar los datos: 400");
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });

    it("Debe rechazar error al parsear los datos al actualizar", function (done) {
      const originalJson = Response.prototype.json;
      Response.prototype.json = function () {
        return Promise.reject(new Error("Simulado: JSON corrupto"));
      };

      const empleadoRolActualizado = new EmpleadoRol();
      empleadoRolActualizado.idRol = { idRol: idRolCreado };

      cut
        .update(idEmpleadoRolCreado, empleadoRolActualizado)
        .then(() => {
          Response.prototype.json = originalJson;
          done(new Error("La actualización debería haber fallado"));
        })
        .catch((error) => {
          Response.prototype.json = originalJson;
          try {
            chai.expect(error).to.have.property("mensaje");
            chai.expect(error.mensaje).to.include("Error al parsear los datos: Simulado: JSON corrupto");
            done();
          } catch (assertError) {
            done(assertError);
          }
        });
    });
  });

  // ==========================================
  // Método Delete
  // ==========================================
  describe("Method: delete()", function () {
    it("Debe eliminar la asignación empleado_rol exitosamente (204) y fallar al reintentar", function (done) {
      cut
        .delete(idEmpleadoRolCreado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          
          const idEliminado = idEmpleadoRolCreado;
          idEmpleadoRolCreado = null;

          return cut.delete(idEliminado);
        })
        .then(() => done(new Error("La segunda eliminación debió retornar 404")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.include("Error al eliminar los datos: 404");
          done();
        });
    });

    it("Debe rechazar al intentar eliminar una asignación inexistente (404)", function (done) {
      cut
        .delete("00000000-0000-0000-0000-000000000000")
        .then(() => done(new Error("La eliminación debió fallar")))
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai.expect(error.mensaje).to.include("Error al eliminar los datos: 404");
          done();
        })
        .catch((e) => done(new Error(e.mensaje || e)));
    });
  });
});

mocha.run();