import * as chai from "../../../lib/chai/index.js";
import FacturaDAO from "../../../../../src/js/control/factura_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import Factura from "../../../../../src/js/entity/factura.js";

mocha.setup("bdd");

describe("FacturaDAO Integration Tests - Online", function () {
  let cut;
  let idCreado;

  // IMPORTANTE: Coloca aquí UUIDs reales que existan en tus tablas 'caja' y 'empleado_rol'
  const idCajaReal = "REEMPLAZA-CON-UUID-REAL-DE-CAJA";
  const idEmpleadoRolReal = "REEMPLAZA-CON-UUID-REAL-DE-EMPLEADO-ROL";

  before(function () {
    cut = new FacturaDAO();
  });

  it("Debe crear una instancia de FacturaDAO", function () {
    chai.expect(cut).to.be.an.instanceOf(FacturaDAO);
  });

  // ==========================================
  // Método Create
  // ==========================================
  describe("Method: create()", function () {
    it("Debe retornar un DefaultResponse con los datos de la factura creada", async function () {
      const factura = new Factura();
      factura.idCaja = { idCaja: idCajaReal };
      factura.idEmpleadoRol = { idEmpleadoRol: idEmpleadoRolReal };
      factura.cliente = "Cliente de Prueba";
      factura.montoTotal = 15.50;
      factura.observaciones = "Prueba de facturación";

      const response = await cut.create(factura);

      chai.expect(response).to.be.an.instanceOf(DefaultResponse);
      chai.expect(response.datos).to.be.an("object");
      chai.expect(response.datos).to.have.property("id");
      chai.expect(response.datos).to.have.property("location");
      chai.expect(response.datos.id).to.exist;
      chai.expect(response.datos.location).to.exist;

      idCreado = response.datos.id;
    });

    it("Debe rechazar cuando falla la creación por datos inválidos (400 o 500)", async function () {
      const facturaInvalida = new Factura();
      // Sin idCaja ni idEmpleadoRol -> FacturaResource retorna 400 BAD_REQUEST
      facturaInvalida.cliente = "Factura sin relaciones";

      try {
        await cut.create(facturaInvalida);
        throw new Error("La creación debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.match(/Error al crear los datos: (400|500)/);
      }
    });

    it("Debe rechazar cuando se envía entidad con id (400 o 422)", async function () {
      const facturaConId = new Factura();
      facturaConId.idFactura = "123e4567-e89b-12d3-a456-426614174000";
      facturaConId.idCaja = { idCaja: idCajaReal };
      facturaConId.idEmpleadoRol = { idEmpleadoRol: idEmpleadoRolReal };
      facturaConId.cliente = "Cliente con ID";

      try {
        await cut.create(facturaConId);
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
    it("Debe retornar un DefaultResponse con un array de facturas y total_datos", async function () {
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
    it("Debe retornar un DefaultResponse con la factura encontrada", async function () {
      const response = await cut.findById(idCreado);

      chai.expect(response).to.be.an.instanceOf(DefaultResponse);
      chai.expect(response.datos).to.be.an("object");
      const factura = response.datos;
      chai.expect(factura).to.have.property("idFactura");
      chai.expect(factura.idFactura).to.exist;
      chai.expect(factura.idFactura).to.equal(idCreado);
    });

    it("Debe rechazar si no se encuentra la factura (404)", async function () {
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
    it("Debe actualizar la factura creada y retornar un DefaultResponse con los datos actualizados", async function () {
      const facturaActualizada = new Factura();
      facturaActualizada.idCaja = { idCaja: idCajaReal };
      facturaActualizada.idEmpleadoRol = { idEmpleadoRol: idEmpleadoRolReal };
      facturaActualizada.cliente = "Cliente Actualizado";
      facturaActualizada.montoTotal = 25.00;
      facturaActualizada.observaciones = "Observación modificada";

      const response = await cut.update(idCreado, facturaActualizada);

      chai.expect(response).to.be.an.instanceOf(DefaultResponse);
      chai.expect(response.datos).to.be.an("object");
      chai.expect(response.datos).to.have.property("idFactura");
      chai.expect(response.datos.idFactura).to.equal(idCreado);
    });

    it("Debe rechazar al intentar actualizar una factura que no existe (404)", async function () {
      const facturaInexistente = new Factura();
      facturaInexistente.idCaja = { idCaja: idCajaReal };
      facturaInexistente.idEmpleadoRol = { idEmpleadoRol: idEmpleadoRolReal };
      facturaInexistente.cliente = "Cliente Inexistente";

      try {
        await cut.update("123e4567-e89b-12d3-a456-426614174999", facturaInexistente);
        throw new Error("La actualización debería haber fallado");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al modificar los datos: 404");
      }
    });

    it("Debe rechazar al intentar actualizar con datos inválidos (400 o 500)", async function () {
      const facturaInvalida = new Factura();
      // Sin idCaja ni idEmpleadoRol -> FacturaResource retorna 400 BAD_REQUEST
      facturaInvalida.cliente = "Actualización sin relaciones";

      try {
        await cut.update(idCreado, facturaInvalida);
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

      const facturaActualizada = {
        idCaja: { idCaja: idCajaReal },
        idEmpleadoRol: { idEmpleadoRol: idEmpleadoRolReal },
        cliente: "Cliente Actualizado"
      };

      try {
        await cut.update(idCreado, facturaActualizada);
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
    it("Debe eliminar la factura creada y rechazar al intentar encontrarla", async function () {
      await cut.delete(idCreado);

      try {
        await cut.findById(idCreado);
        throw new Error("La factura debería haber sido eliminada");
      } catch (error) {
        chai.expect(error).to.have.property("mensaje");
        chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
      }
    });

    it("Debe rechazar al intentar eliminar una factura que no existe (404)", async function () {
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