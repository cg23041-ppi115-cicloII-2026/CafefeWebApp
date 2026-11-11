import * as chai from "../../../lib/chai/index.js";
import FacturaOrdenProductoDAO from "../划分/../../../../src/js/control/factura_orden_producto_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import FacturaOrdenProducto from "../../../../../src/js/entity/factura_orden_producto.js";

mocha.setup("bdd");

describe("FacturaOrdenProductoDAO Integration Tests - Online", function () {
  let cut;
  let idAsociacionCreada;
  const idFacturaPadre = "123e4567-e89b-12d3-a456-426614174000"; // ID de la Factura padre

  before(function () {
    cut = new FacturaOrdenProductoDAO(idFacturaPadre);
  });

  it("Debe crear una instancia de FacturaOrdenProductoDAO con la URL contextuada", function () {
    chai.expect(cut).to.be.an.instanceOf(FacturaOrdenProductoDAO);
    chai.expect(cut.URL).to.include(`factura/${idFacturaPadre}/ordenproducto/`);
  });

  // ==========================================
  // Método Create
  // ==========================================
  describe("Method: create()", function () {
    it("Debe retornar un DefaultResponse con los datos de la asociación creada", function (done) {
      const facturaOrdenProducto = new FacturaOrdenProducto();
      facturaOrdenProducto.cantidad = 3;
      facturaOrdenProducto.observaciones = "Asociación de prueba";
      facturaOrdenProducto.activo = true;

      cut
        .create(facturaOrdenProducto)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("id");
          chai.expect(response.datos).to.have.property("location");
          chai.expect(response.datos.id).to.exist;
          chai.expect(response.datos.location).to.exist;
          idAsociacionCreada = response.datos.id;
          chai.expect(idAsociacionCreada).to.exist;
          done();
        })
        .catch(done);
    });

    it("Debe rechazar cuando falla la creación por datos inválidos (400 o 500)", function (done) {
      const asociacionInvalida = new FacturaOrdenProducto();
      // Excede la longitud permitida para forzar error de base de datos
      asociacionInvalida.observaciones = "A".repeat(200);

      cut
        .create(asociacionInvalida)
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
      const asociacionConId = new FacturaOrdenProducto();
      asociacionConId.idFacturaOrdenProducto = "123e4567-e89b-12d3-a456-426614174888";
      asociacionConId.cantidad = 1;

      cut
        .create(asociacionConId)
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
    it("Debe retornar un DefaultResponse con un array de asociaciones y total_datos", function (done) {
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
    it("Debe retornar un DefaultResponse con la asociación encontrada", function (done) {
      cut
        .findById(idAsociacionCreada)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          const asociacion = response.datos;
          chai.expect(asociacion).to.have.property("idFacturaOrdenProducto");
          chai.expect(asociacion.idFacturaOrdenProducto).to.exist;
          chai.expect(asociacion.idFacturaOrdenProducto).to.equal(idAsociacionCreada);
          done();
        })
        .catch(done);
    });

    it("Debe rechazar si no se encuentra la asociación (404)", function (done) {
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
        .findById(idAsociacionCreada)
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
    it("Debe actualizar la asociación creada y retornar un DefaultResponse", function (done) {
      const asociacionActualizada = new FacturaOrdenProducto();
      asociacionActualizada.cantidad = 10;
      asociacionActualizada.observaciones = "Asociación actualizada";
      asociacionActualizada.activo = true;

      cut
        .update(idAsociacionCreada, asociacionActualizada)
        .then((response) => {
          chai.expect(response).to.be.an.instanceOf(DefaultResponse);
          chai.expect(response.datos).to.be.an("object");
          chai.expect(response.datos).to.have.property("idFacturaOrdenProducto");
          chai.expect(response.datos.idFacturaOrdenProducto).to.equal(idAsociacionCreada);
          done();
        })
        .catch(done);
    });

    it("Debe rechazar al intentar actualizar una asociación que no existe (404)", function (done) {
      const asociacionInexistente = new FacturaOrdenProducto();
      asociacionInexistente.cantidad = 1;

      cut
        .update("123e4567-e89b-12d3-a456-426614174999", asociacionInexistente)
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
      const asociacionInvalida = new FacturaOrdenProducto();
      // Excede la longitud máxima
      asociacionInvalida.observaciones = "A".repeat(200);

      cut
        .update(idAsociacionCreada, asociacionInvalida)
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

      const asociacionActualizada = { cantidad: 5 };
      cut
        .update(idAsociacionCreada, asociacionActualizada)
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
    it("Debe eliminar la asociación creada y rechazar al intentar encontrarla", function (done) {
      cut
        .delete(idAsociacionCreada)
        .then(() => {
          cut
            .findById(idAsociacionCreada)
            .then(() => {
              done(new Error("La asociación debería haber sido eliminada"));
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

    it("Debe rechazar al intentar eliminar una asociación que no existe (404)", function (done) {
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