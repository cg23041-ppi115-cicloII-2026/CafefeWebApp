import * as chai from "../../../lib/chai/index.js";
import EmpleadoDAO from "../划分/../../../../src/js/control/empleado_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import Empleado from "../../../../../src/js/entity/empleado.js";

mocha.setup("bdd");

describe("EmpleadoDAO Integration Tests - Online", function () {
  let cut;
  let idCreado;

  before(function () {
    cut = new EmpleadoDAO();
  });

  it("Debe crear una instancia de EmpleadoDAO", function () {
    chai.expect(cut).to.be.an.instanceOf(EmpleadoDAO);
  });

  // ==========================================
  // Método Create
  // ==========================================
  describe("Method: create()", function () {
    it("Debe retornar un DefaultResponse con los datos del empleado creado", function (done) {
      const empleado = new Empleado();
      empleado.nombre = "Empleado de Prueba";
      empleado.apellido = "Pérez";
      empleado.activo = true;

      cut
        .create(empleado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("id");
          chai.expect(response.datos).to.have.property("location");
          chai.expect(response.datos.id).to.exist;
          chai.expect(response.datos.location).to.exist;
          idCreado = response.datos.id;
          chai.expect(idCreado).to.exist;
          done();
        })
        .catch(done);
    });

    it("Debe rechazar cuando falla la creación por datos inválidos (400 o 500)", function (done) {
      const empleadoInvalido = new Empleado();
      // Se excede el límite de longitud para forzar error en base de datos
      empleadoInvalido.nombre = "A".repeat(200);

      cut
        .create(empleadoInvalido)
        .then(() => {
          done(new Error("La creación debería haber fallado"));
        })
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai
            .expect(error.mensaje)
            .to.match(/Error al crear los datos: (400|500)/);
          done();
        })
        .catch(done);
    });

    it("Debe rechazar cuando se envía entidad con id (400 o 422)", function (done) {
      const empleadoConId = new Empleado();
      empleadoConId.idEmpleado = "123e4567-e89b-12d3-a456-426614174000";
      empleadoConId.nombre = "Empleado de Prueba";

      cut
        .create(empleadoConId)
        .then(() => {
          done(new Error("La creación debería haber fallado"));
        })
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai
            .expect(error.mensaje)
            .to.match(/Error al crear los datos: (400|422)/);
          done();
        })
        .catch(done);
    });
  });

  // ==========================================
  // Método FindRange
  // ==========================================
  describe("Method: findRange()", function () {
    it("Debe retornar un DefaultResponse con un array de empleados y total_datos", function (done) {
      cut
        .findRange(0, 10)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("array");
          chai.expect(response).to.have.property("total_datos");
          if (response.total_datos !== null) {
            chai.expect(response.total_datos).to.be.a("string");
          }
          chai.expect(response.datos).to.have.length.above(0);
          done();
        })
        .catch(done);
    });

    it("Debe rechazar si se mandan parámetros inválidos (400)", function (done) {
      cut
        .findRange(-1, -5)
        .then(() => {
          done(new Error("La consulta debería haber fallado"));
        })
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai
            .expect(error.mensaje)
            .to.include("Error al obtener los datos: 400");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar error al parsear los datos al consultar un rango", function (done) {
      const originalJson = Response.prototype.json;
      Response.prototype.json = function () {
        return Promise.reject(new Error("Simulado: JSON corrupto"));
      };

      cut
        .findRange(0, 10)
        .then(() => {
          Response.prototype.json = originalJson;
          done(new Error("La consulta debería haber fallado"));
        })
        .catch((error) => {
          Response.prototype.json = originalJson;
          try {
            chai.expect(error).to.have.property("mensaje");
            chai
              .expect(error.mensaje)
              .to.include(
                "Error al parsear los datos: Simulado: JSON corrupto"
              );
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
    it("Debe retornar un DefaultResponse con el empleado encontrado", function (done) {
      cut
        .findById(idCreado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          const empleado = response.datos;
          chai.expect(empleado).to.have.property("idEmpleado");
          chai.expect(empleado).to.have.property("nombre");
          chai.expect(empleado.idEmpleado).to.exist;
          chai.expect(empleado.nombre).to.exist;
          chai.expect(empleado.idEmpleado).to.equal(idCreado);
          chai.expect(empleado.nombre).to.equal("Empleado de Prueba");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar si no se encuentra el empleado (404)", function (done) {
      cut
        .findById("123e4567-e89b-12d3-a456-426614174999")
        .then(() => {
          done(new Error("La consulta debería haber fallado"));
        })
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai
            .expect(error.mensaje)
            .to.include("Error al obtener los datos: 404");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar si se manda un id inválido (404)", function (done) {
      cut
        .findById("id-invalido")
        .then(() => {
          done(new Error("La consulta debería haber fallado"));
        })
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai
            .expect(error.mensaje)
            .to.include("Error al obtener los datos: 404");
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
        .findById(idCreado)
        .then(() => {
          Response.prototype.json = originalJson;
          done(new Error("La consulta debería haber fallado"));
        })
        .catch((error) => {
          Response.prototype.json = originalJson;

          try {
            chai.expect(error).to.have.property("mensaje");
            chai
              .expect(error.mensaje)
              .to.include(
                "Error al parsear los datos: Simulado: JSON corrupto"
              );
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
    it("Debe actualizar el empleado creado y retornar un DefaultResponse con los datos actualizados", function (done) {
      const empleadoActualizado = new Empleado();
      empleadoActualizado.nombre = "Empleado Actualizado";
      empleadoActualizado.apellido = "Pérez Modificado";
      empleadoActualizado.activo = true;

      cut
        .update(idCreado, empleadoActualizado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("idEmpleado");
          chai.expect(response.datos).to.have.property("nombre");
          chai.expect(response.datos.idEmpleado).to.equal(idCreado);
          chai.expect(response.datos.nombre).to.equal("Empleado Actualizado");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar al intentar actualizar un empleado que no existe (404)", function (done) {
      const empleadoInexistente = new Empleado();
      empleadoInexistente.nombre = "Empleado Inexistente";

      cut
        .update("123e4567-e89b-12d3-a456-426614174999", empleadoInexistente)
        .then(() => {
          done(new Error("La actualización debería haber fallado"));
        })
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai
            .expect(error.mensaje)
            .to.include("Error al modificar los datos: 404");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar al intentar actualizar con datos inválidos (400 o 500)", function (done) {
      const empleadoInvalido = new Empleado();
      // Se excede el límite de caracteres para provocar error de base de datos
      empleadoInvalido.nombre = "A".repeat(200);

      cut
        .update(idCreado, empleadoInvalido)
        .then(() => {
          done(new Error("La actualización debería haber fallado"));
        })
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai
            .expect(error.mensaje)
            .to.match(/Error al modificar los datos: (400|500)/);
          done();
        })
        .catch(done);
    });

    it("Debe rechazar error al parsear los datos al actualizar", function (done) {
      const originalJson = Response.prototype.json;
      Response.prototype.json = function () {
        return Promise.reject(new Error("Simulado: JSON corrupto"));
      };

      const empleadoActualizado = { nombre: "Empleado Actualizado" };
      cut
        .update(idCreado, empleadoActualizado)
        .then(() => {
          Response.prototype.json = originalJson;
          done(new Error("La actualización debería haber fallado"));
        })
        .catch((error) => {
          Response.prototype.json = originalJson;

          try {
            chai.expect(error).to.have.property("mensaje");
            chai
              .expect(error.mensaje)
              .to.include(
                "Error al parsear los datos: Simulado: JSON corrupto"
              );
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
    it("Debe eliminar el empleado creado y rechazar al intentar encontrarlo", function (done) {
      cut
        .delete(idCreado)
        .then(() => {
          cut
            .findById(idCreado)
            .then(() => {
              done(new Error("El empleado debería haber sido eliminado"));
            })
            .catch((error) => {
              chai.expect(error).to.have.property("mensaje");
              chai
                .expect(error.mensaje)
                .to.include("Error al obtener los datos: 404");
              done();
            })
            .catch(done);
        })
        .catch(done);
    });

    it("Debe rechazar al intentar eliminar un empleado que no existe (404)", function (done) {
      cut
        .delete("123e4567-e89b-12d3-a456-426614174999")
        .then(() => {
          done(new Error("La eliminación debería haber fallado"));
        })
        .catch((error) => {
          chai.expect(error).to.have.property("mensaje");
          chai
            .expect(error.mensaje)
            .to.include("Error al eliminar los datos: 404");
          done();
        })
        .catch(done);
    });
  });
});

mocha.run();