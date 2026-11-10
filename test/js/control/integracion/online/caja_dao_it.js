import * as chai from "../../../lib/chai/index.js";
import CajaDAO from "../../../../../src/js/control/caja_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import Caja from "../../../../../src/js/entity/caja.js";

mocha.setup("bdd");

describe("CajaDAO Integration Tests - Online", function () {
  let cut;
  let idCreado;

  before(function () {
    cut = new CajaDAO();
  });

  it("Debe crear una instancia de CajaDAO", function () {
    chai.expect(cut).to.be.an.instanceOf(CajaDAO);
  });

  // ==========================================
  // Método Create
  // ==========================================
  describe("Method: create()", function () {
    it("Debe retornar un DefaultResponse con los datos de la caja creada", function (done) {
      const caja = new Caja();
      caja.nombre = "Caja de Prueba";
      caja.observaciones = "Observación inicial";
      caja.activo = true;

      cut
        .create(caja)
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
      const cajaInvalida = new Caja();
      // Se excede el límite varchar(155) para provocar error de base de datos
      cajaInvalida.nombre = "A".repeat(200);

      cut
        .create(cajaInvalida)
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
      const cajaConId = new Caja();
      cajaConId.idCaja = "123e4567-e89b-12d3-a456-426614174000";
      cajaConId.nombre = "Caja de Prueba";

      cut
        .create(cajaConId)
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
    it("Debe retornar un DefaultResponse con un array de cajas y total_datos", function (done) {
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
                "Error al parsear los datos: Simulado: JSON corrupto",
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
    it("Debe retornar un DefaultResponse con la caja encontrada", function (done) {
      cut
        .findById(idCreado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          const caja = response.datos;
          chai.expect(caja).to.have.property("idCaja");
          chai.expect(caja).to.have.property("nombre");
          chai.expect(caja.idCaja).to.exist;
          chai.expect(caja.nombre).to.exist;
          chai.expect(caja.idCaja).to.equal(idCreado);
          chai.expect(caja.nombre).to.equal("Caja de Prueba");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar si no se encuentra la caja (404)", function (done) {
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
                "Error al parsear los datos: Simulado: JSON corrupto",
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
    it("Debe actualizar la caja creada y retornar un DefaultResponse con los datos actualizados", function (done) {
      const cajaActualizada = new Caja();
      cajaActualizada.nombre = "Caja Actualizada";
      cajaActualizada.observaciones = "Observación modificada";
      cajaActualizada.activo = true;

      cut
        .update(idCreado, cajaActualizada)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("idCaja");
          chai.expect(response.datos).to.have.property("nombre");
          chai.expect(response.datos.idCaja).to.equal(idCreado);
          chai.expect(response.datos.nombre).to.equal("Caja Actualizada");
          done();
        })
        .catch(done);
    });

    it("Debe rechazar al intentar actualizar una caja que no existe (404)", function (done) {
      const cajaInexistente = new Caja();
      cajaInexistente.nombre = "Caja Inexistente";

      cut
        .update("123e4567-e89b-12d3-a456-426614174999", cajaInexistente)
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
      const cajaInvalida = new Caja();
      // Se excede el límite varchar(155) para provocar error de base de datos
      cajaInvalida.nombre = "A".repeat(200);

      cut
        .update(idCreado, cajaInvalida)
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

      const cajaActualizada = { nombre: "Caja Actualizada" };
      cut
        .update(idCreado, cajaActualizada)
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
                "Error al parsear los datos: Simulado: JSON corrupto",
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
    it("Debe eliminar la caja creada y rechazar al intentar encontrarla", function (done) {
      cut
        .delete(idCreado)
        .then(() => {
          cut
            .findById(idCreado)
            .then(() => {
              done(new Error("La caja debería haber sido eliminada"));
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

    it("Debe rechazar al intentar eliminar una caja que no existe (404)", function (done) {
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