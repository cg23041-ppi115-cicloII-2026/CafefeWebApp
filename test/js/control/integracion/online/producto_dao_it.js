import * as chai from "../../../lib/chai/index.js";
import ProductoDAO from "../../../../../src/js/control/producto_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import Producto from "../../../../../src/js/entity/producto.js";

mocha.setup("bdd");

describe("ProductoDAO Integration Tests-online", function () {
	const ID_INEXISTENTE = "123e4567-e89b-12d3-a456-426614174999";

	let cut;
	let idCreado;
	let nombreCreado;

	function crearProducto(nombre, comentarios, precioSugerido) {
		const producto = new Producto();
		producto.nombre = nombre;
		producto.activo = true;
		producto.comentarios = comentarios;
		producto.precioSugerido = precioSugerido;
		return producto;
	}

	before(function () {
		cut = new ProductoDAO();
	});

	after(function (done) {
		if (!idCreado) {
			done();
			return;
		}
		cut.delete(idCreado).then(() => done()).catch(() => done());
	});

	it("Debe crear una instancia de ProductoDAO", function () {
		chai.expect(cut).to.be.an.instanceOf(ProductoDAO);
	});

	describe("Method: create()", function () {
		it("Debe crear un producto y retornar un DefaultResponse", function (done) {
			nombreCreado = `Producto IT ${Date.now()}`;

			cut.create(crearProducto(nombreCreado, "Producto de prueba", 10.5))
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
			const productoConId = crearProducto("Producto con id", "", 5);
			productoConId.idProducto = "123e4567-e89b-12d3-a456-426614174000";

			cut.create(productoConId)
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
		it("Debe retornar un DefaultResponse con un array de productos", function (done) {
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
		it("Debe retornar el producto creado por su id", function (done) {
			cut.findById(idCreado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos).to.have.property("idProducto");
					chai.expect(response.datos.idProducto).to.equal(idCreado);
					chai.expect(response.datos.nombre).to.equal(nombreCreado);
					chai.expect(response.datos.activo).to.equal(true);
					chai.expect(response.datos.comentarios).to.equal("Producto de prueba");
					chai.expect(Number(response.datos.precioSugerido)).to.equal(10.5);
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si no se encuentra el producto (404)", function (done) {
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
		it("Debe actualizar el producto creado", function (done) {
			// El PUT reemplaza la entidad completa, por eso se envían todos los campos
			const productoActualizado = crearProducto("Producto actualizado", "Comentario modificado", 20);

			cut.update(idCreado, productoActualizado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos.idProducto).to.equal(idCreado);
					chai.expect(response.datos.nombre).to.equal("Producto actualizado");
					chai.expect(response.datos.comentarios).to.equal("Comentario modificado");
					chai.expect(Number(response.datos.precioSugerido)).to.equal(20);
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización de un producto inexistente (404)", function (done) {
			cut.update(ID_INEXISTENTE, crearProducto("Producto inexistente", "", 5))
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

			cut.update(idCreado, crearProducto("Producto actualizado", "Comentario modificado", 20))
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
		it("Debe eliminar el producto creado y rechazar al volver a buscarlo", function (done) {
			const idEliminado = idCreado;
			cut.delete(idEliminado)
				.then(() => {
					idCreado = null;
					return cut.findById(idEliminado);
				})
				.then(() => done(new Error("El producto debería haber sido eliminado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
					done();
				});
		});

		it("Debe rechazar al eliminar un producto inexistente (404)", function (done) {
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