import * as chai from "../../../lib/chai/index.js";
import DescuentoProductoDAO from "../../../../../src/js/control/descuento_producto_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import DescuentoProducto from "../../../../../src/js/entity/descuento_producto.js";

mocha.setup("bdd");

describe("DescuentoProductoDAO Integration Tests - Online", function () {
  let cut;
  let idCreado;

  // IMPORTANTE: Coloca aquí UUIDs reales que existan en tus tablas 'descuento' y 'producto'
  const idDescuentoPadre = "2beddec2-1eed-4550-8ce6-08825bccea12";
  const idProductoReal = "9acf92dd-06d2-4943-aac9-8f87338ef039";

  before(function () {
    cut = new DescuentoProductoDAO(idDescuentoPadre);
  });

  it("Debe crear una instancia de DescuentoProductoDAO con la URL contextuada", function () {
    chai.expect(cut).to.be.an.instanceOf(DescuentoProductoDAO);
    chai.expect(cut.URL).to.include(`descuento/${encodeURIComponent(idDescuentoPadre)}/producto/`);
  });

  // ==========================================
  // Método Create
  // ==========================================
  describe("Method: create()", function () {
    it("Debe retornar un DefaultResponse con los datos de la relación descuento-producto creada", async function () {
      const descuentoProducto = new DescuentoProducto();
      // El backend espera el objeto Producto anidado: { idProducto: "..." }
      descuentoProducto.idProducto = { idProducto: idProductoReal };
      descuentoProducto.fechaDesde = "2026-11-12T00:00:00Z";
      descuentoProducto.fechaHasta = "2026-12-31T23:59:59Z";
      descuentoProducto.valor = 15;
      descuentoProducto.observaciones = "Asociación de prueba";

      const response = await cut.create(descuentoProducto);

      chai.expect(response).to.be.an.instanceOf(DefaultResponse);
      chai.expect(response.datos).to.be.an("object");
      chai.expect(response.datos).to.have.property("id");
      chai.expect(response.datos).to.have.property("location");
      chai.expect(response.datos.id).to.exist;
      chai.expect(response.datos.location).to.exist;

      idCreado = response.datos.id;
    });

    it("Debe rechazar cuando falla la creación por datos inválidos (400 o 404)", async function () {
      const relacionInvalida = new DescuentoProducto();
      // Sin idProducto -> el resource retorna 400 BAD_REQUEST
      relacionInvalida.observaciones = "Relación sin producto";

      try {
        await cut.create(relacionInvalida);
        throw new Error("La creación debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.match(/Error al crear los datos: (400|404|500)/);
      }
    });

    it("Debe rechazar cuando se envía entidad con id (400 o 422)", async function () {
      const relacionConId = new DescuentoProducto();
      relacionConId.idDescuentoProducto = "123e4567-e89b-12d3-a456-426614174888";
      relacionConId.idProducto = { idProducto: idProductoReal };
      relacionConId.valor = 10;

      try {
        await cut.create(relacionConId);
        throw new Error("La creación debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.match(/Error al crear los datos: (400|422)/);
      }
    });
  });

  // ==========================================
  // Método FindRange
  // ==========================================
  describe("Method: findRange()", function () {
    it("Debe retornar un DefaultResponse con un array de relaciones descuento-producto y total_datos", async function () {
      const response = await cut.findRange(0, 10);

      chai.expect(response).to.be.an.instanceOf(DefaultResponse);
      chai.expect(response.datos).to.be.an("array");
      chai.expect(response).to.have.property("total_datos");
      if (response.total_datos !== null) {
        chai.expect(response.total_datos).to.be.a("string");
      }
      chai.expect(response.datos).to.have.length.above(0);
    });

    it("Debe rechazar si se mandan parámetros inválidos (400)", async function () {
      try {
        await cut.findRange(-1, -5);
        throw new Error("La consulta debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al obtener los datos: 400");
      }
    });

    it("Debe rechazar error al parsear los datos al consultar un rango", async function () {
      const originalJson = Response.prototype.json;
      Response.prototype.json = function () {
        return Promise.reject(new Error("Simulado: JSON corrupto"));
      };

      try {
        await cut.findRange(0, 10);
        throw new Error("La consulta debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al parsear los datos: Simulado: JSON corrupto");
      } finally {
        Response.prototype.json = originalJson;
      }
    });
  });

  // ==========================================
  // Método FindById
  // ==========================================
  describe("Method: findById()", function () {
    it("Debe retornar un DefaultResponse con la relación descuento-producto encontrada", async function () {
      const response = await cut.findById(idCreado);

      chai.expect(response).to.be.an.instanceOf(DefaultResponse);
      chai.expect(response.datos).to.be.an("object");
      chai.expect(response.datos).to.have.property("idDescuentoProducto");
      chai.expect(response.datos.idDescuentoProducto).to.equal(idCreado);
    });

    it("Debe rechazar si no se encuentra la relación (404)", async function () {
      try {
        await cut.findById("123e4567-e89b-12d3-a456-426614174999");
        throw new Error("La consulta debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
      }
    });

    it("Debe rechazar si se manda un id inválido (404)", async function () {
      try {
        await cut.findById("id-invalido");
        throw new Error("La consulta debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
      }
    });

    it("Debe rechazar error al parsear los datos", async function () {
      const originalJson = Response.prototype.json;
      Response.prototype.json = function () {
        return Promise.reject(new Error("Simulado: JSON corrupto"));
      };

      try {
        await cut.findById(idCreado);
        throw new Error("La consulta debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al parsear los datos: Simulado: JSON corrupto");
      } finally {
        Response.prototype.json = originalJson;
      }
    });
  });

  // ==========================================
  // Método Update
  // ==========================================
  describe("Method: update()", function () {
    it("Debe actualizar la relación creada y retornar un DefaultResponse con los datos actualizados", async function () {
      const relacionActualizada = new DescuentoProducto();
      relacionActualizada.idProducto = { idProducto: idProductoReal };
      relacionActualizada.valor = 25;
      relacionActualizada.observaciones = "Observación modificada";

      const response = await cut.update(idCreado, relacionActualizada);

      chai.expect(response).to.be.an.instanceOf(DefaultResponse);
      chai.expect(response.datos).to.be.an("object");
      chai.expect(response.datos).to.have.property("idDescuentoProducto");
      chai.expect(response.datos.idDescuentoProducto).to.equal(idCreado);
    });

    it("Debe rechazar al intentar actualizar una relación que no existe (404)", async function () {
      const relacionInexistente = new DescuentoProducto();
      relacionInexistente.idProducto = { idProducto: idProductoReal };
      relacionInexistente.valor = 10;

      try {
        await cut.update("123e4567-e89b-12d3-a456-426614174999", relacionInexistente);
        throw new Error("La actualización debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al modificar los datos: 404");
      }
    });

    it("Debe rechazar al intentar actualizar con datos inválidos (400 o 500)", async function () {
      const relacionInvalida = new DescuentoProducto();
      // Sin idProducto -> el resource retorna 400 BAD_REQUEST
      relacionInvalida.observaciones = "Actualización sin producto";

      try {
        await cut.update(idCreado, relacionInvalida);
        throw new Error("La actualización debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.match(/Error al modificar los datos: (400|500)/);
      }
    });

    it("Debe rechazar error al parsear los datos al actualizar", async function () {
      const originalJson = Response.prototype.json;
      Response.prototype.json = function () {
        return Promise.reject(new Error("Simulado: JSON corrupto"));
      };

      try {
        await cut.update(idCreado, {
          idProducto: { idProducto: idProductoReal },
          valor: 30
        });
        throw new Error("La actualización debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al parsear los datos: Simulado: JSON corrupto");
      } finally {
        Response.prototype.json = originalJson;
      }
    });
  });

  // ==========================================
  // Método Delete
  // ==========================================
  describe("Method: delete()", function () {
    it("Debe eliminar la relación creada y rechazar al intentar encontrarla", async function () {
      await cut.delete(idCreado);

      try {
        await cut.findById(idCreado);
        throw new Error("La relación debería haber sido eliminada");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
      }
    });

    it("Debe rechazar al intentar eliminar una relación que no existe (404)", async function () {
      try {
        await cut.delete("123e4567-e89b-12d3-a456-426614174999");
        throw new Error("La eliminación debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al eliminar los datos: 404");
      }
    });
  });
});

mocha.run();