import * as chai from "../../../lib/chai/index.js";
import ProductoCaracteristicaDAO from "../../../../../src/js/control/producto_caracteristica_dao.js";
import ProductoDAO from "../../../../../src/js/control/producto_dao.js";
import CaracteristicaDAO from "../../../../../src/js/control/caracteristica_dao.js";
import TipoCaracteristicaDAO from "../../../../../src/js/control/tipo_caracteristica_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import ProductoCaracteristica from "../../../../../src/js/entity/producto_caracteristica.js";
import Producto from "../../../../../src/js/entity/producto.js";
import Caracteristica from "../../../../../src/js/entity/caracteristica.js";
import TipoCaracteristica from "../../../../../src/js/entity/tipo_caracteristica.js";

mocha.setup("bdd");

describe("ProductoCaracteristicaDAO Integration Tests-online", function () {
	const ID_INEXISTENTE = "123e4567-e89b-12d3-a456-426614174999";

	let cut;
	let productoDAO;
	let caracteristicaDAO;
	let tipoDAO;
	let idProducto;
	let idCaracteristica;
	let idTipo;
	let idCreado;

	function crearProductoCaracteristica(valor) {
		const productoCaracteristica = new ProductoCaracteristica();
		productoCaracteristica.valor = valor;
		productoCaracteristica.idCaracteristica = { idCaracteristica: idCaracteristica };
		return productoCaracteristica;
	}

	before(async function () {
		productoDAO = new ProductoDAO();
		caracteristicaDAO = new CaracteristicaDAO();
		tipoDAO = new TipoCaracteristicaDAO();

		const tipo = new TipoCaracteristica();
		tipo.nombre = `Tipo IT ${Date.now()}`;
		tipo.activo = true;
		idTipo = (await tipoDAO.create(tipo)).datos.id;

		const caracteristica = new Caracteristica();
		caracteristica.nombre = `Caracteristica IT ${Date.now()}`;
		caracteristica.activo = true;
		caracteristica.observaciones = "Característica para pruebas de ProductoCaracteristica";
		caracteristica.idTipoCaracteristica = { idTipoCaracteristica: idTipo };
		idCaracteristica = (await caracteristicaDAO.create(caracteristica)).datos.id;

		const producto = new Producto();
		producto.nombre = `Producto IT ${Date.now()}`;
		producto.activo = true;
		producto.comentarios = "Producto para pruebas de ProductoCaracteristica";
		producto.precioSugerido = 10;
		idProducto = (await productoDAO.create(producto)).datos.id;

		cut = new ProductoCaracteristicaDAO(idProducto);
	});

	after(async function () {
		// Orden inverso a la creación, por las llaves foráneas
		if (idCreado) {
			await cut.delete(idCreado).catch(() => {});
		}
		if (idProducto) {
			await productoDAO.delete(idProducto).catch(() => {});
		}
		if (idCaracteristica) {
			await caracteristicaDAO.delete(idCaracteristica).catch(() => {});
		}
		if (idTipo) {
			await tipoDAO.delete(idTipo).catch(() => {});
		}
	});

	it("Debe crear una instancia de ProductoCaracteristicaDAO", function () {
		chai.expect(cut).to.be.an.instanceOf(ProductoCaracteristicaDAO);
	});

	describe("Method: create()", function () {
		it("Debe crear una característica del producto y retornar un DefaultResponse", function (done) {
			cut.create(crearProductoCaracteristica("Valor inicial"))
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
			const conId = crearProductoCaracteristica("Valor con id");
			conId.idProductoCaracteristica = "123e4567-e89b-12d3-a456-426614174000";

			cut.create(conId)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación sin característica (400)", function (done) {
			const sinCaracteristica = new ProductoCaracteristica();
			sinCaracteristica.valor = "Sin característica";

			cut.create(sinCaracteristica)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación con una característica inexistente (404)", function (done) {
			const caracteristicaInexistente = crearProductoCaracteristica("Característica inexistente");
			caracteristicaInexistente.idCaracteristica = { idCaracteristica: ID_INEXISTENTE };

			cut.create(caracteristicaInexistente)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación en un producto inexistente (404)", function (done) {
			new ProductoCaracteristicaDAO(ID_INEXISTENTE)
				.create(crearProductoCaracteristica("Producto inexistente"))
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 404");
					done();
				})
				.catch(done);
		});
	});

	describe("Method: findRange()", function () {
		it("Debe retornar un DefaultResponse con un array de características del producto", function (done) {
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
		it("Debe retornar la característica del producto por su id", function (done) {
			cut.findById(idCreado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos).to.have.property("idProductoCaracteristica");
					chai.expect(response.datos.idProductoCaracteristica).to.equal(idCreado);
					chai.expect(response.datos.valor).to.equal("Valor inicial");
					chai.expect(response.datos.idCaracteristica.idCaracteristica).to.equal(idCaracteristica);
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
			new ProductoCaracteristicaDAO(ID_INEXISTENTE)
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

	describe("Method: update()", function () {
		it("Debe actualizar la característica del producto", function (done) {
			cut.update(idCreado, crearProductoCaracteristica("Valor modificado"))
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos.idProductoCaracteristica).to.equal(idCreado);
					chai.expect(response.datos.valor).to.equal("Valor modificado");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización de un registro inexistente (404)", function (done) {
			cut.update(ID_INEXISTENTE, crearProductoCaracteristica("Valor"))
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización sin característica (400)", function (done) {
			const sinCaracteristica = new ProductoCaracteristica();
			sinCaracteristica.valor = "Sin característica";

			cut.update(idCreado, sinCaracteristica)
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización con una característica inexistente (404)", function (done) {
			const caracteristicaInexistente = crearProductoCaracteristica("Valor");
			caracteristicaInexistente.idCaracteristica = { idCaracteristica: ID_INEXISTENTE };

			cut.update(idCreado, caracteristicaInexistente)
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
			cut.update(idCreado, crearProductoCaracteristica("Valor modificado"))
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
		it("Debe eliminar la característica del producto y rechazar al volver a buscarla", function (done) {
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