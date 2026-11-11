import * as chai from "../../../lib/chai/index.js";
import RolDAO from "../../../../../src/js/control/rol_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import Rol from "../../../../../src/js/entity/rol.js";

mocha.setup("bdd");

describe("RolDAO Integration Tests - Online", function () {
  let cut;
  let idCreado;

  before(function () {
    cut = new RolDAO();
  });

  it("Debe crear una instancia de RolDAO", function () {
    chai.expect(cut).to.be.an.instanceOf(RolDAO);
  });

  // ==========================================
  // Método Create
  // ==========================================
  describe("Method: create()", function () {
    it("Debe retornar un DefaultResponse con los datos del rol creado", function (done) {
      const rol = new Rol();
      rol.nombre = "Rol de Prueba";
      rol.descripcion = "Descripción del rol de prueba";
      rol.activo = true;

      cut
        .create(rol)
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
      const rolInvalido = new Rol();
      // Se excede el límite de longitud para provocar error en la base de datos
      rolInvalido.nombre = "A".repeat(200);

      cut
        .create(rolInvalido)
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
      const rolConId = new Rol();
      rolConId.idRol = "123e4567-e89b-12d3-a456-426614174000";
      rolConId.nombre = "Rol de Prueba";

      cut
        .create(rolConId)
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
    it("Debe retornar un DefaultResponse con un array de roles y total_datos", function (done) {
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
    it("Debe retornar un DefaultResponse con el rol encontrado", function (done) {
      cut
        .findById(idCreado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          const rol = response.datos;
          chai.expect(rol).to.have.property("idRol");
          chai.expect(rol).to.have.property("nombre");
          chai.expect(rol.idRol).to.exist;
          chai.expect(rol.nombre).to.exist;
          chai.expect(rol.idRol).to.equal(idCreado);
          chai.expect(rol.nombre).to.equal("Rol de Prueba");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar si no se encuentra el rol (404)", function (done) {
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
    it("Debe actualizar el rol creado y retornar un DefaultResponse con los datos actualizados", function (done) {
      const rolActualizado = new Rol();
      rolActualizado.nombre = "Rol Actualizado";
      rolActualizado.descripcion = "Descripción modificada";
      rolActualizado.activo = true;

      cut
        .update(idCreado, rolActualizado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("idRol");
          chai.expect(response.datos).to.have.property("nombre");
          chai.expect(response.datos.idRol).to.equal(idCreado);
          chai.expect(response.datos.nombre).to.equal("Rol Actualizado");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar al intentar actualizar un rol que no existe (404)", function (done) {
      const rolInexistente = new Rol();
      rolInexistente.nombre = "Rol Inexistente";

      cut
        .update("123e4567-e89b-12d3-a456-426614174999", rolInexistente)
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
      const rolInvalido = new Rol();
      // Se excede el límite de caracteres para provocar error de base de datos
      rolInvalido.nombre = "A".repeat(200);

      cut
        .update(idCreado, rolInvalido)
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

      const rolActualizado = { nombre: "Rol Actualizado" };
      cut
        .update(idCreado, rolActualizado)
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
    it("Debe eliminar el rol creado y rechazar al intentar encontrarlo", function (done) {
      cut
        .delete(idCreado)
        .then(() => {
          cut
            .findById(idCreado)
            .then(() => {
              done(new Error("El rol debería haber sido eliminado"));
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

    it("Debe rechazar al intentar eliminar un rol que no existe (404)", function (done) {
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