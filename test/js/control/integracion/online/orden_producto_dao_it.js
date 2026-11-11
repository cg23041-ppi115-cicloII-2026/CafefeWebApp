import * as chai from "../../../lib/chai/index.js";
import OrdenProductoDAO from "../../../../../src/js/control/orden_producto_dao.js";
import OrdenDAO from "../../../../../src/js/control/orden_dao.js";
import ProductoDAO from "../../../../../src/js/control/producto_dao.js";
import EmpleadoDAO from "../../../../../src/js/control/empleado_dao.js";
import RolDAO from "../../../../../src/js/control/rol_dao.js";
import EmpleadoRolDAO from "../../../../../src/js/control/empleado_rol_dao.js";
import DefaultResponse from "../../../../../src/js/entity/default_response.js";
import OrdenProducto from "../../../../../src/js/entity/orden_producto.js";
import Orden from "../../../../../caja.js";
import Producto from "../../../../../src/js/entity/producto.js";
import Empleado from "../../../../../src/js/entity/empleado.js";
import Rol from "../../../../../src/js/entity/rol.js";
import EmpleadoRol from "../../../../../src/js/entity/empleado_rol.js";

mocha.setup("bdd");

describe("OrdenProductoDAO Integration Tests-online", function () {
	const ID_INEXISTENTE = "123e4567-e89b-12d3-a456-426614174999";

	let cut;
	let ordenDAO;
	let productoDAO;
	let empleadoDAO;
	let rolDAO;
	let empleadoRolDAO;

	let idProducto;
	let idEmpleado;
	let idRol;
	let idEmpleadoRol;
	let idOrden;
	let idCreado;

	function crearOrdenProducto(precio, observaciones) {
		const ordenProducto = new OrdenProducto();
		ordenProducto.precio = precio;
		ordenProducto.observaciones = observaciones;
		ordenProducto.idProducto = { idProducto: idProducto };
		return ordenProducto;
	}

	before(function (done) {
		ordenDAO = new OrdenDAO();
		productoDAO = new ProductoDAO();
		empleadoDAO = new EmpleadoDAO();
		rolDAO = new RolDAO();

		const ts = Date.now().toString().slice(-4);
		let pasoActual = "Crear Producto";

		const producto = new Producto();
		producto.nombre = `Producto IT ${Date.now()}`;
		producto.activo = true;
		producto.comentarios = "Producto para pruebas de OrdenProducto";
		producto.precioSugerido = 10;

		productoDAO.create(producto)
			.then((res) => {
				idProducto = res.datos.id;
				pasoActual = "Crear Empleado";

				const empleado = new Empleado();
				empleado.nombre = `Empleado_IT_${ts}`;
				empleado.apellido = "Prueba";
				empleado.activo = true;
				return empleadoDAO.create(empleado);
			})
			.then((res) => {
				idEmpleado = res.datos.id;
				pasoActual = "Crear Rol";

				const rol = new Rol();
				rol.nombre = `ROL_IT_${ts}`;
				rol.activo = true;
				return rolDAO.create(rol);
			})
			.then((res) => {
				idRol = res.datos.id;
				pasoActual = "Crear EmpleadoRol";

				empleadoRolDAO = new EmpleadoRolDAO(idEmpleado);
				const empleadoRol = new EmpleadoRol();
				empleadoRol.idEmpleado = { idEmpleado: idEmpleado };
				empleadoRol.idRol = { idRol: idRol };
				empleadoRol.activo = true;
				empleadoRol.observaciones = "Asignación para pruebas de OrdenProducto";
				return empleadoRolDAO.create(empleadoRol);
			})
			.then((res) => {
				idEmpleadoRol = res.datos.id;
				pasoActual = "Crear Orden";

				const orden = new Orden();
				orden.idEmpleadoRol = { idEmpleadoRol: idEmpleadoRol };
				return ordenDAO.create(orden);
			})
			.then((res) => {
				idOrden = res.datos.id;
				cut = new OrdenProductoDAO(idOrden);
				done();
			})
			.catch((err) => {
				const msg = err.mensaje || JSON.stringify(err);
				done(new Error(`Falló en el paso [${pasoActual}]: ${msg}`));
			});
	});

	after(async function () {
		// Orden inverso a la creación, por las llaves foráneas
		if (idCreado) {
			await cut.delete(idCreado).catch(() => {});
		}
		if (idOrden) {
			await ordenDAO.delete(idOrden).catch(() => {});
		}
		if (idEmpleadoRol) {
			await empleadoRolDAO.delete(idEmpleadoRol).catch(() => {});
		}
		if (idRol) {
			await rolDAO.delete(idRol).catch(() => {});
		}
		if (idEmpleado) {
			await empleadoDAO.delete(idEmpleado).catch(() => {});
		}
		if (idProducto) {
			await productoDAO.delete(idProducto).catch(() => {});
		}
	});

	it("Debe crear una instancia de OrdenProductoDAO", function () {
		chai.expect(cut).to.be.an.instanceOf(OrdenProductoDAO);
	});

	// ==========================================
	// Método Create
	// ==========================================
	describe("Method: create()", function () {
		it("Debe crear un producto de la orden y retornar un DefaultResponse", function (done) {
			cut.create(crearOrdenProducto(12.5, "Observación inicial"))
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
			const conId = crearOrdenProducto(5, "");
			conId.idOrdenProducto = "123e4567-e89b-12d3-a456-426614174000";

			cut.create(conId)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación sin producto (400)", function (done) {
			const sinProducto = new OrdenProducto();
			sinProducto.precio = 5;

			cut.create(sinProducto)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación con un producto inexistente (404)", function (done) {
			const productoInexistente = crearOrdenProducto(5, "");
			productoInexistente.idProducto = { idProducto: ID_INEXISTENTE };

			cut.create(productoInexistente)
				.then(() => done(new Error("La creación debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al crear los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la creación en una orden inexistente (404)", function (done) {
			new OrdenProductoDAO(ID_INEXISTENTE)
				.create(crearOrdenProducto(5, ""))
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
		it("Debe retornar un DefaultResponse con un array de productos de la orden", function (done) {
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
		it("Debe retornar el producto de la orden por su id", function (done) {
			cut.findById(idCreado)
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos).to.have.property("idOrdenProducto");
					chai.expect(response.datos.idOrdenProducto).to.equal(idCreado);
					chai.expect(Number(response.datos.precio)).to.equal(12.5);
					chai.expect(response.datos.idProducto.idProducto).to.equal(idProducto);
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

		it("Debe rechazar si el registro pertenece a otra orden (404)", function (done) {
			new OrdenProductoDAO(ID_INEXISTENTE)
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
		it("Debe actualizar el producto de la orden", function (done) {
			cut.update(idCreado, crearOrdenProducto(15.5, "Observación modificada"))
				.then((response) => {
					chai.expect(response).to.be.an.instanceOf(DefaultResponse);
					chai.expect(response.datos).to.be.an("object");
					chai.expect(response.datos.idOrdenProducto).to.equal(idCreado);
					chai.expect(Number(response.datos.precio)).to.equal(15.5);
					chai.expect(response.datos.observaciones).to.equal("Observación modificada");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización de un registro inexistente (404)", function (done) {
			cut.update(ID_INEXISTENTE, crearOrdenProducto(5, ""))
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 404");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización sin producto (400)", function (done) {
			const sinProducto = new OrdenProducto();
			sinProducto.precio = 5;

			cut.update(idCreado, sinProducto)
				.then(() => done(new Error("La actualización debería haber fallado")))
				.catch((error) => {
					chai.expect(error).to.have.property("mensaje");
					chai.expect(error.mensaje).to.include("Error al modificar los datos: 400");
					done();
				})
				.catch(done);
		});

		it("Debe rechazar la actualización con un producto inexistente (404)", function (done) {
			const productoInexistente = crearOrdenProducto(5, "");
			productoInexistente.idProducto = { idProducto: ID_INEXISTENTE };

			cut.update(idCreado, productoInexistente)
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
			cut.update(idCreado, crearOrdenProducto(15.5, "Observación modificada"))
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
		it("Debe eliminar el producto de la orden y rechazar al volver a buscarlo", function (done) {
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