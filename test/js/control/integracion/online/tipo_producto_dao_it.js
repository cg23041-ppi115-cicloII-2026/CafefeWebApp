import * as chai from "../../../lib/chai/index.js";
import TipoProductoDAO from "../../../../../src/js/control/tipo_producto_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import TipoProducto from "../../../../../src/js/entity/tipo_producto.js";

mocha.setup("bdd");

describe("TipoProductoDAO Integration Tests-online", function () {
	const ID_INEXISTENTE = "123e4567-e89b-12d3-a456-426614174999";

	let cut;
	let idCreado;
	let nombreCreado;

	function crearTipo(nombre, observaciones) {
		const tipo = new TipoProducto();
		tipo.nombre = nombre;
		tipo.activo = true;
		tipo.observaciones = observaciones;
		return tipo;
	}

	before(function () {
		cut = new TipoProductoDAO();
	});

	after(function (done) {
		if (!idCreado) {
			done();
			return;
		}
		cut.delete(idCreado).then(() => done()).catch(() => done());
	});

	it("Debe crear una instancia de TipoProductoDAO", function () {
		chai.expect(cut).to.be.an.instanceOf(TipoProductoDAO);
	});

	describe("Method: create()", function () {
		it("Debe crear un tipo de producto y retornar un DefaultResponse", function (done) {
			nombreCreado = `TipoProducto IT ${Date.now()}`;

			cut.create(crearTipo(nombreCreado, "Observación inicial"))
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos).to.have.property("id");
					chai.expect(response.datos).to.have.property("location");
					chai.expect(response.datos.id).to.exist;
					chai.expect(response.datos.location).to.exist;
					idCreado = response.datos.id;
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación de una entidad que ya tiene id (400)", function (done) {
			const conId = crearTipo("Tipo con id", "");
			conId.idTipoProducto = "123e4567-e89b-12d3-a456-426614174000";

			cut.create(conId)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});
	});

	describe("Method: findRange()", function () {
		it("Debe retornar un DefaultResponse con un array de tipos de producto", function (done) {
			cut.findRange(0, 10)
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
				.catch(done);
		});

		it("Debe rechazar parámetros de paginación inválidos (400)", function (done) {
			cut.findRange(-1, -5)
				.then(() => done(new Error("La consulta debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si max excede el límite permitido (400)", function (done) {
			cut.findRange(0, 51)
				.then(() => done(new Error("La consulta debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si ocurre un error al parsear la respuesta", function (done) {
			const originalJson = Response.prototype.json;
			Response.prototype.json = function () {
				return Promise.reject(new Error("Simulado: JSON corrupto"));
			};

			cut.findRange(0, 10)
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

	describe("Method: findById()", function () {
		it("Debe retornar el tipo de producto creado por su id", function (done) {
			cut.findById(idCreado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos).to.have.property("idTipoProducto");
					chai.expect(response.datos.idTipoProducto).to.equal(idCreado);
					chai.expect(response.datos.nombre).to.equal(nombreCreado);
					chai.expect(response.datos.activo).to.equal(true);
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si no se encuentra el tipo de producto (404)", function (done) {
			cut.findById(ID_INEXISTENTE)
				.then(() => done(new Error("La consulta debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si se envía un id inválido (404)", function (done) {
			cut.findById("id-invalido")
				.then(() => done(new Error("La consulta debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si ocurre un error al parsear la respuesta", function (done) {
			const originalJson = Response.prototype.json;
			Response.prototype.json = function () {
				return Promise.reject(new Error("Simulado: JSON corrupto"));
			};

			cut.findById(idCreado)
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

	describe("Method: update()", function () {
		it("Debe actualizar el tipo de producto creado", function (done) {
			// El PUT reemplaza la entidad completa, por eso se envían todos los campos
			const tipoActualizado = crearTipo("Tipo actualizado", "Observación modificada");

			cut.update(idCreado, tipoActualizado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos.idTipoProducto).to.equal(idCreado);
					chai.expect(response.datos.nombre).to.equal("Tipo actualizado");
					chai.expect(response.datos.observaciones).to.equal("Observación modificada");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización de un tipo de producto inexistente (404)", function (done) {
			cut.update(ID_INEXISTENTE, crearTipo("Tipo inexistente", ""))
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si ocurre un error al parsear la respuesta", function (done) {
			const originalJson = Response.prototype.json;
			Response.prototype.json = function () {
				return Promise.reject(new Error("Simulado: JSON corrupto"));
			};

			cut.update(idCreado, crearTipo("Tipo actualizado", "Observación modificada"))
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

	describe("Method: delete()", function () {
		it("Debe eliminar el tipo de producto creado y rechazar al volver a buscarlo", function (done) {
			const idEliminado = idCreado;
			cut.delete(idEliminado)
				.then(() => {
					idCreado = null;
					return cut.findById(idEliminado);
				})
				.then(() => done(new Error("El tipo de producto debería haber sido eliminado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
					done();
				});
		});

		it("Debe rechazar al eliminar un tipo de producto inexistente (404)", function (done) {
			cut.delete(ID_INEXISTENTE)
				.then(() => done(new Error("La eliminación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al eliminar los datos: 404");
					done();
				})
				.catch(done);
		});
	});
});

mocha.run();