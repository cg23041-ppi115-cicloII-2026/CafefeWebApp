import * as chai from "../../../lib/chai/index.js";
import PagoDetalleDAO from "../../../../../src/js/control/pago_detalle_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import PagoDetalle from "../../../../../src/js/entity/pago_detalle.js";

mocha.setup("bdd");

describe("PagoDetalleDAO Integration Tests - Online", function () {
  let cut;
  let idDetalleCreado;
  const idPagoPadre = "123e4567-e89b-12d3-a456-426614174000"; // ID del Pago padre

  before(function () {
    cut = new PagoDetalleDAO(idPagoPadre);
  });

  it("Debe crear una instancia de PagoDetalleDAO con la URL contextuada", function () {
    chai.expect(cut).to.be.an.instanceOf(PagoDetalleDAO);
    chai.expect(cut.URL).to.include(`pago/${idPagoPadre}/detalle/`);
  });

  // ==========================================
  // Método Create
  // ==========================================
  describe("Method: create()", function () {
    it("Debe retornar un DefaultResponse con los datos del detalle creado", function (done) {
      const pagoDetalle = new PagoDetalle();
      pagoDetalle.monto = 12.50;
      pagoDetalle.observaciones = "Detalle de pago de prueba";
      pagoDetalle.activo = true;

      cut
        .create(pagoDetalle)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("id");
          chai.expect(response.datos).to.have.property("location");
          chai.expect(response.datos.id).to.exist;
          chai.expect(response.datos.location).to.exist;
          idDetalleCreado = response.datos.id;
          chai.expect(idDetalleCreado).to.exist;
          done();
        })
        .catch(done);
    });

    it("Debe rechazar cuando falla la creación por datos inválidos (400 o 500)", function (done) {
      const detalleInvalido = new PagoDetalle();
      // Excede la longitud permitida para forzar error de base de datos
      detalleInvalido.observaciones = "A".repeat(200);

      cut
        .create(detalleInvalido)
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
      const detalleConId = new PagoDetalle();
      detalleConId.idPagoDetalle = "123e4567-e89b-12d3-a456-426614174888";
      detalleConId.monto = 50.00;

      cut
        .create(detalleConId)
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
    it("Debe retornar un DefaultResponse con un array de detalles y total_datos", function (done) {
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
    it("Debe retornar un DefaultResponse con el detalle encontrado", function (done) {
      cut
        .findById(idDetalleCreado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          const detalle = response.datos;
          chai.expect(detalle).to.have.property("idPagoDetalle");
          chai.expect(detalle).to.have.property("monto");
          chai.expect(detalle.idPagoDetalle).to.exist;
          chai.expect(detalle.monto).to.exist;
          chai.expect(detalle.idPagoDetalle).to.equal(idDetalleCreado);
          done();
        })
        .catch(done);
    });

    it("Debe rechazar si no se encuentra el detalle (404)", function (done) {
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
        .findById(idDetalleCreado)
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
    it("Debe actualizar el detalle de pago creado y retornar un DefaultResponse", function (done) {
      const detalleActualizado = new PagoDetalle();
      detalleActualizado.monto = 20.00;
      detalleActualizado.observaciones = "Detalle actualizado";
      detalleActualizado.activo = true;

      cut
        .update(idDetalleCreado, detalleActualizado)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("idPagoDetalle");
          chai.expect(response.datos.idPagoDetalle).to.equal(idDetalleCreado);
          done();
        })
        .catch(done);
    });

    it("Debe rechazar al intentar actualizar un detalle que no existe (404)", function (done) {
      const detalleInexistente = new PagoDetalle();
      detalleInexistente.monto = 15.00;

      cut
        .update("123e4567-e89b-12d3-a456-426614174999", detalleInexistente)
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
      const detalleInvalido = new PagoDetalle();
      // Excede la longitud máxima
      detalleInvalido.observaciones = "A".repeat(200);

      cut
        .update(idDetalleCreado, detalleInvalido)
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

      const detalleActualizado = { monto: 20.00 };
      cut
        .update(idDetalleCreado, detalleActualizado)
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
    it("Debe eliminar el detalle creado y rechazar al intentar encontrarlo", function (done) {
      cut
        .delete(idDetalleCreado)
        .then(() => {
          cut
            .findById(idDetalleCreado)
            .then(() => {
              done(new Error("El detalle de pago debería haber sido eliminado"));
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

    it("Debe rechazar al intentar eliminar un detalle que no existe (404)", function (done) {
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