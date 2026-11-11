import * as chai from "../../../lib/chai/index.js";
import CaracteristicaDAO from "../../../../../src/js/control/caracteristica_dao.js";
import TipoCaracteristicaDAO from "../../../../../src/js/control/tipo_caracteristica_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import Caracteristica from "../../../../../src/js/entity/caracteristica.js";
import TipoCaracteristica from "../../../../../src/js/entity/tipo_caracteristica.js";

mocha.setup("bdd");

describe("CaracteristicaDAO Integration Tests-online", function () {
	let cut;
	let tipoDAO;
	let idTipo;
	let idCreado;
	let nombreCreado;

	function crearCaracteristica(nombre, observaciones) {
		const caracteristica = new Caracteristica();
		caracteristica.nombre = nombre;
		caracteristica.observaciones = observaciones;
		caracteristica.activo = true;
		caracteristica.idTipoCaracteristica = { idTipoCaracteristica: idTipo };
		return caracteristica;
	}

	before(function (done) {
		cut = new CaracteristicaDAO();
		tipoDAO = new TipoCaracteristicaDAO();

		const tipo = new TipoCaracteristica();
		tipo.nombre = `Tipo IT ${Date.now()}`;
		tipo.activo = true;

		tipoDAO.create(tipo)
			.then((response) => {
				idTipo = response.datos.id;
				done();
			})
			.catch(done);
	});

	after(function (done) {
		// Primero la característica y luego el tipo, por la llave foránea
		const borrarCaracteristica = idCreado
			? cut.delete(idCreado).catch(() => {})
			: Promise.resolve();

		borrarCaracteristica
			.then(() => (idTipo ? tipoDAO.delete(idTipo) : null))
			.then(() => done())
			.catch(() => done());
	});

	it("Debe crear una instancia de CaracteristicaDAO", function () {
		chai.expect(cut).to.be.an.instanceOf(CaracteristicaDAO);
	});

	describe("Method: create()", function () {
		it("Debe crear una característica y retornar un DefaultResponse", function (done) {
			nombreCreado = `Caracteristica IT ${Date.now()}`;
			const caracteristica = crearCaracteristica(nombreCreado, "Característica de prueba");

			cut.create(caracteristica)
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
			const caracteristicaConId = crearCaracteristica("Característica con id", "");
			caracteristicaConId.idCaracteristica = "123e4567-e89b-12d3-a456-426614174000";

			cut.create(caracteristicaConId)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación sin tipo de característica (400)", function (done) {
			const caracteristicaSinTipo = new Caracteristica();
			caracteristicaSinTipo.nombre = "Sin tipo";
			caracteristicaSinTipo.activo = true;

			cut.create(caracteristicaSinTipo)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación con un tipo inexistente (400)", function (done) {
			const caracteristica = crearCaracteristica("Tipo inexistente", "");
			caracteristica.idTipoCaracteristica = {
				idTipoCaracteristica: "123e4567-e89b-12d3-a456-426614174999",
			};

			cut.create(caracteristica)
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
		it("Debe retornar un DefaultResponse con un array de características", function (done) {
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
		it("Debe retornar la característica creada por su id", function (done) {
			cut.findById(idCreado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos).to.have.property("idCaracteristica");
					chai.expect(response.datos.idCaracteristica).to.equal(idCreado);
					chai.expect(response.datos.nombre).to.equal(nombreCreado);
					chai.expect(response.datos.idTipoCaracteristica.idTipoCaracteristica).to.equal(idTipo);
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si no se encuentra la característica (404)", function (done) {
			cut.findById("123e4567-e89b-12d3-a456-426614174999")
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
	});

	describe("Method: update()", function () {
		it("Debe actualizar la característica creada", function (done) {
			const caracteristicaActualizada = crearCaracteristica(
				"Característica actualizada",
				"Observación modificada",
			);

			cut.update(idCreado, caracteristicaActualizada)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos.idCaracteristica).to.equal(idCreado);
					chai.expect(response.datos.nombre).to.equal("Característica actualizada");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización de una característica inexistente (404)", function (done) {
			const caracteristica = crearCaracteristica("Característica inexistente", "");

			cut.update("123e4567-e89b-12d3-a456-426614174999", caracteristica)
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización sin tipo de característica (400)", function (done) {
			const caracteristicaSinTipo = new Caracteristica();
			caracteristicaSinTipo.nombre = "Sin tipo";

			cut.update(idCreado, caracteristicaSinTipo)
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si ocurre un error al parsear la respuesta", function (done) {
			const originalJson = Response.prototype.json;
			Response.prototype.json = function () {
				return Promise.reject(new Error("Simulado: JSON corrupto"));
			};

			// Debe ser un objeto válido (con tipo) para que el backend responda 200
			const caracteristica = crearCaracteristica("Característica actualizada", "");

			cut.update(idCreado, caracteristica)
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
		it("Debe eliminar la característica creada y rechazar al volver a buscarla", function (done) {
			const idEliminado = idCreado;
			cut.delete(idEliminado)
				.then(() => {
					idCreado = null;
					return cut.findById(idEliminado);
				})
				.then(() => done(new Error("La característica debería haber sido eliminada")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
					done();
				});
		});

		it("Debe rechazar al eliminar una característica inexistente (404)", function (done) {
			cut.delete("123e4567-e89b-12d3-a456-426614174999")
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