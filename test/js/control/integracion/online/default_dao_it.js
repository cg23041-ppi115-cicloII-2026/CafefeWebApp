import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import DefaultDAO from "../../src/control/default_dao.js"; // Ajusta la ruta según tu proyecto
import DefaultResponse from "../../src/entity/default_response.js";
import DefaultError from "../../src/entity/default_error.js";

// Subclase concreta para apuntar a un endpoint real de tu API REST
class TipoProductoTestDAO extends DefaultDAO {
  constructor() {
    super();
    this.URL = `${this.BASE_URL}tipo_producto/`; // Ajusta si tu endpoint es 'tipoproducto/' o 'caja/'
  }
}

describe("Pruebas de Integración - DefaultDAO (Backend Open Liberty)", () => {
  let dao;
  let idCreado = null;

  before(() => {
    dao = new TipoProductoTestDAO();
  });

  it("1. _create() debe insertar un registro (HTTP 201) y retornar el ID desde el header Location", async () => {
    const nuevoRegistro = {
      nombre: "Prueba Integración JS",
      activo: true,
      observaciones: "Creado desde test de integración Node",
    };

    const respuesta = await dao._create(nuevoRegistro);

    assert.ok(respuesta instanceof DefaultResponse, "Debe retornar una instancia de DefaultResponse");
    assert.ok(respuesta.datos.location, "Debe incluir el header Location");
    assert.ok(respuesta.datos.id, "Debe extraer el UUID creado");

    idCreado = respuesta.datos.id;
  });

  it("2. _findRange() debe obtener una lista paginada (HTTP 200) y el header Total-Records", async () => {
    const respuesta = await dao._findRange(0, 10);

    assert.ok(respuesta instanceof DefaultResponse);
    assert.ok(Array.isArray(respuesta.datos), "Los datos deben ser un arreglo");
    assert.ok(respuesta.datos.length > 0, "Debe haber al menos un registro");
    assert.notEqual(respuesta.total_datos, null, "Debe incluir el header Total-Records");
  });

  it("3. _findById() debe encontrar el registro recién creado por su UUID (HTTP 200)", async () => {
    assert.ok(idCreado, "Se requiere un ID creado en el paso 1");

    const respuesta = await dao._findById(idCreado);

    assert.ok(respuesta instanceof DefaultResponse);
    assert.equal(respuesta.datos.idTipoProducto || respuesta.datos.id_tipo_producto, idCreado);
    assert.equal(respuesta.datos.nombre, "Prueba Integración JS");
  });

  it("4. _update() debe modificar el registro existente (HTTP 200) y devolver la entidad actualizada", async () => {
    assert.ok(idCreado, "Se requiere un ID creado en el paso 1");

    const entidadModificada = {
      idTipoProducto: idCreado,
      nombre: "Prueba Integración Modificada",
      activo: false,
      observaciones: "Actualizado vía PUT",
    };

    const respuesta = await dao._update(idCreado, entidadModificada);

    assert.ok(respuesta instanceof DefaultResponse);
    assert.equal(respuesta.datos.nombre, "Prueba Integración Modificada");
    assert.equal(respuesta.datos.activo, false);
  });

  it("5. _delete() debe eliminar el registro creado (HTTP 204)", async () => {
    assert.ok(idCreado, "Se requiere un ID creado en el paso 1");

    const respuesta = await dao._delete(idCreado);

    assert.ok(respuesta instanceof DefaultResponse);
    assert.equal(respuesta.datos, null);
  });

  it("6. _findById() debe rechazar con DefaultError (404) al buscar el registro ya eliminado", async () => {
    await assert.rejects(
      async () => {
        await dao._findById(idCreado);
      },
      (err) => {
        assert.ok(err instanceof DefaultError, "El rechazo debe ser instancia de DefaultError");
        assert.match(err.mensaje, /Error al obtener los datos: 404/);
        return true;
      }
    );
  });

  it("7. Métodos abstractos deben lanzar Error si no son sobrescritos", () => {
    const baseDao = new DefaultDAO();
    assert.throws(() => baseDao.findById("123"), /Metodo no implementado/);
    assert.throws(() => baseDao.findRange(0, 10), /Metodo no implementado/);
    assert.throws(() => baseDao.create({}), /Metodo no implementado/);
    assert.throws(() => baseDao.update("123", {}), /Metodo no implementado/);
    assert.throws(() => baseDao.delete("123"), /Metodo no implementado/);
  });
});