import * as chai from "../../../lib/chai/index.js";
import ProductoTipoProductoDAO from "../../../../../src/js/control/producto_tipo_producto_dao.js";
import ProductoDAO from "../../../../../src/js/control/producto_dao.js";
import TipoProductoDAO from "../../../../../src/js/control/tipo_producto_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import ProductoTipoProducto from "../../../../../src/js/entity/producto_tipo_producto.js";
import Producto from "../../../../../src/js/entity/producto.js";
import TipoProducto from "../../../../../src/js/entity/tipo_producto.js";

mocha.setup("bdd");

describe("ProductoTipoProductoDAO Integration Tests-online", function () {
	const ID_INEXISTENTE = "123e4567-e89b-12d3-a456-426614174999";

	let cut;
	let productoDAO;
	let tipoProductoDAO;
	let idProducto;
	let idTipoProducto;
	let idCreado;
	let fechaOriginal;

	function crearProductoTipoProducto(observaciones) {
		const productoTipoProducto = new ProductoTipoProducto();
		productoTipoProducto.observaciones = observaciones;
		productoTipoProducto.idTipoProducto = { idTipoProducto: idTipoProducto };
		return productoTipoProducto;
	}

	before(function (done) {
		productoDAO = new ProductoDAO();
		tipoProductoDAO = new TipoProductoDAO();

		let pasoActual = "Crear TipoProducto";

		const tipoProducto = new TipoProducto();
		tipoProducto.nombre = `TipoProducto IT ${Date.now()}`;
		tipoProducto.activo = true;
		tipoProducto.observaciones = "Tipo para pruebas de ProductoTipoProducto";

		tipoProductoDAO.create(tipoProducto)
			.then((res) => {
				idTipoProducto = res.datos.id;
				pasoActual = "Crear Producto";

				const producto = new Producto();
				producto.nombre = `Producto IT ${Date.now()}`;
				producto.activo = true;
				producto.comentarios = "Producto para pruebas de ProductoTipoProducto";
				producto.precioSugerido = 10;
				return productoDAO.create(producto);
			})
			.then((res) => {
				idProducto = res.datos.id;
				cut = new ProductoTipoProductoDAO(idProducto);
				done();
			})
			.catch((err) => {
				done(new Error(`Falló en el paso [${pasoActual}]: ${err.mensaje || JSON.stringify(err)}`));
			});
	});

	after(async function () {
		// Orden inverso a la creación, por las llaves foráneas
		if (idCreado) {
			await cut.delete(idCreado).catch(() => {});
		}
		if (idProducto) {
			await productoDAO.delete(idProducto).catch(() => {});
		}
		if (idTipoProducto) {
			await tipoProductoDAO.delete(idTipoProducto).catch(() => {});
		}
	});

	it("Debe crear una instancia de ProductoTipoProductoDAO", function () {
		chai.expect(cut).to.be.an.instanceOf(ProductoTipoProductoDAO);
	});

	// ==========================================
	// Método Create
	// ==========================================
	describe("Method: create()", function () {
		it("Debe crear un tipo de producto del producto y retornar un DefaultResponse", function (done) {
			cut.create(crearProductoTipoProducto("Observación inicial"))
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
			const conId = crearProductoTipoProducto("Con id");
			conId.idProductoTipoProducto = "123e4567-e89b-12d3-a456-426614174000";

			cut.create(conId)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación sin tipo de producto (400)", function (done) {
			const sinTipo = new ProductoTipoProducto();
			sinTipo.observaciones = "Sin tipo";

			cut.create(sinTipo)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación con un tipo de producto inexistente (404)", function (done) {
			const tipoInexistente = crearProductoTipoProducto("Tipo inexistente");
			tipoInexistente.idTipoProducto = { idTipoProducto: ID_INEXISTENTE };

			cut.create(tipoInexistente)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación en un producto inexistente (404)", function (done) {
			new ProductoTipoProductoDAO(ID_INEXISTENTE)
				.create(crearProductoTipoProducto("Producto inexistente"))
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 404");
					done();
				})
				.catch(done);
		});
	});

	// ==========================================
	// Método FindRange
	// ==========================================
	describe("Method: findRange()", function () {
		it("Debe retornar un DefaultResponse con un array de tipos de producto del producto", function (done) {
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

	// ==========================================
	// Método FindById
	// ==========================================
	describe("Method: findById()", function () {
		it("Debe retornar el tipo de producto del producto por su id", function (done) {
			cut.findById(idCreado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos).to.have.property("idProductoTipoProducto");
					chai.expect(response.datos.idProductoTipoProducto).to.equal(idCreado);
					chai.expect(response.datos.observaciones).to.equal("Observación inicial");
					chai.expect(response.datos.idTipoProducto.idTipoProducto).to.equal(idTipoProducto);
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si no se encuentra el registro (404)", function (done) {
			cut.findById(ID_INEXISTENTE)
				.then(() => done(new Error("La consulta debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar si el registro pertenece a otro producto (404)", function (done) {
			new ProductoTipoProductoDAO(ID_INEXISTENTE)
				.findById(idCreado)
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

	// ==========================================
	// Método Update
	// ==========================================
	describe("Method: update()", function () {
		// El PUT reemplaza la entidad completa: se parte de lo que devolvió el servidor
		// para reenviar fechaCreacion tal cual y no perderla.
		before(function (done) {
			cut.findById(idCreado)
				.then((response) => {
					fechaOriginal = response.datos.fechaCreacion;
					done();
				})
				.catch(done);
		});

		it("Debe actualizar el tipo de producto del producto", function (done) {
			const actualizado = crearProductoTipoProducto("Observación modificada");
			actualizado.fechaCreacion = fechaOriginal;

			cut.update(idCreado, actualizado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos.idProductoTipoProducto).to.equal(idCreado);
					chai.expect(response.datos.observaciones).to.equal("Observación modificada");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización de un registro inexistente (404)", function (done) {
			cut.update(ID_INEXISTENTE, crearProductoTipoProducto("Inexistente"))
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización sin tipo de producto (400)", function (done) {
			const sinTipo = new ProductoTipoProducto();
			sinTipo.observaciones = "Sin tipo";

			cut.update(idCreado, sinTipo)
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización con un tipo de producto inexistente (404)", function (done) {
			const tipoInexistente = crearProductoTipoProducto("Tipo inexistente");
			tipoInexistente.idTipoProducto = { idTipoProducto: ID_INEXISTENTE };

			cut.update(idCreado, tipoInexistente)
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

			// Objeto válido para que el backend responda 200 y se llegue a json()
			const actualizado = crearProductoTipoProducto("Observación modificada");
			actualizado.fechaCreacion = fechaOriginal;

			cut.update(idCreado, actualizado)
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

	// ==========================================
	// Método Delete
	// ==========================================
	describe("Method: delete()", function () {
		it("Debe eliminar el tipo de producto del producto y rechazar al volver a buscarlo", function (done) {
			const idEliminado = idCreado;
			cut.delete(idEliminado)
				.then(() => {
					idCreado = null;
					return cut.findById(idEliminado);
				})
				.then(() => done(new Error("El registro debería haber sido eliminado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al obtener los datos: 404");
					done();
				});
		});

		it("Debe rechazar al eliminar un registro inexistente (404)", function (done) {
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