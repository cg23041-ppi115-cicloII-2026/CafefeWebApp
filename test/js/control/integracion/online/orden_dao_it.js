import * as chai from "../../../lib/chai/index.js";
import OrdenDAO from "../../../../../src/js/control/orden_dao.js";
import EmpleadoDAO from "../../../../../src/js/control/empleado_dao.js";
import EmpleadoRolDAO from "../../../../../src/js/control/empleado_rol_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import Orden from "../../../../../src/js/entity/orden.js";

mocha.setup("bdd");

describe("OrdenDAO Integration Tests-online", function () {
	let cut;
	let idEmpleadoRol;
	let idCreado;
	let ordenOriginal;

	/**
	 * Busca un EmpleadoRol existente recorriendo los empleados hasta
	 * encontrar uno que tenga al menos un rol asignado.
	 */
	async function buscarEmpleadoRol() {
		const empleados = (await new EmpleadoDAO().findRange(0, 50)).datos;
		for (const empleado of empleados) {
			const roles = (await new EmpleadoRolDAO(empleado.idEmpleado).findRange(0, 1)).datos;
			if (roles.length > 0) {
				return roles[0].idEmpleadoRol;
			}
		}
		throw new Error("No hay ningún EmpleadoRol en la base para probar Orden");
	}

	function crearOrden() {
		const orden = new Orden();
		orden.idEmpleadoRol = { idEmpleadoRol: idEmpleadoRol };
		return orden;
	}

	before(async function () {
		cut = new OrdenDAO();
		idEmpleadoRol = await buscarEmpleadoRol();
	});

	after(function (done) {
		if (!idCreado) {
			done();
			return;
		}
		cut.delete(idCreado).then(() => done()).catch(() => done());
	});

	it("Debe crear una instancia de OrdenDAO", function () {
		chai.expect(cut).to.be.an.instanceOf(OrdenDAO);
	});

	describe("Method: create()", function () {
		it("Debe crear una orden y retornar un DefaultResponse", function (done) {
			cut.create(crearOrden())
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
			const ordenConId = crearOrden();
			ordenConId.idOrden = "123e4567-e89b-12d3-a456-426614174000";

			cut.create(ordenConId)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación sin empleado rol (400)", function (done) {
			cut.create(new Orden())
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación con un empleado rol inexistente (400)", function (done) {
			const orden = new Orden();
			orden.idEmpleadoRol = { idEmpleadoRol: "123e4567-e89b-12d3-a456-426614174999" };

			cut.create(orden)
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
		it("Debe retornar un DefaultResponse con un array de órdenes", function (done) {
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
		it("Debe retornar la orden creada por su id", function (done) {
			cut.findById(idCreado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos).to.have.property("idOrden");
					chai.expect(response.datos.idOrden).to.equal(idCreado);
					chai.expect(response.datos.idEmpleadoRol.idEmpleadoRol).to.equal(idEmpleadoRol);
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si no se encuentra la orden (404)", function (done) {
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
		// Se parte de la orden tal como la devolvió el servidor para no perder
		// fechaCreacion, porque el PUT reemplaza la entidad completa.
		before(function (done) {
			cut.findById(idCreado)
				.then((response) => {
					ordenOriginal = response.datos;
					done();
				})
				.catch(done);
		});

		it("Debe actualizar la orden creada", function (done) {
			const ordenActualizada = crearOrden();
			ordenActualizada.fechaCreacion = ordenOriginal.fechaCreacion;

			cut.update(idCreado, ordenActualizada)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos.idOrden).to.equal(idCreado);
					chai.expect(response.datos.idEmpleadoRol.idEmpleadoRol).to.equal(idEmpleadoRol);
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización de una orden inexistente (404)", function (done) {
			cut.update("123e4567-e89b-12d3-a456-426614174999", crearOrden())
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización sin empleado rol (400)", function (done) {
			cut.update(idCreado, new Orden())
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización con un empleado rol inexistente (400)", function (done) {
			const orden = new Orden();
			orden.idEmpleadoRol = { idEmpleadoRol: "123e4567-e89b-12d3-a456-426614174999" };

			cut.update(idCreado, orden)
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

			// Objeto válido para que el backend responda 200 y se llegue a json()
			const ordenActualizada = crearOrden();
			ordenActualizada.fechaCreacion = ordenOriginal.fechaCreacion;

			cut.update(idCreado, ordenActualizada)
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
		it("Debe eliminar la orden creada y rechazar al volver a buscarla", function (done) {
			const idEliminado = idCreado;
			cut.delete(idEliminado)
				.then(() => {
					idCreado = null;
					return cut.findById(idEliminado);
				})
				.then(() => done(new Error("La orden debería haber sido eliminada")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
					done();
				});
		});

		it("Debe rechazar al eliminar una orden inexistente (404)", function (done) {
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