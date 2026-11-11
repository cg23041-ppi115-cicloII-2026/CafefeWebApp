import DefaultDAO from "./default_dao.js";

class FacturaOrdenProductoDAO extends DefaultDAO {
	constructor(idFactura) {
		super();
		this.URL += `factura/${idFactura}/ordenproducto/`;
	}

	/**
	 * Busca las asociaciones de productos de una factura en un rango paginado.
	 * @param {number} first primer registro a obtener
	 * @param {number} max cantidad máxima de registros a obtener
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	findRange(first, max) {
		return this._findRange(first, max);
	}

	/**
	 * Crea una asociación entre una factura y una orden de producto.
	 * @param {FacturaOrdenProducto} facturaOrdenProducto asociación a crear
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	create(facturaOrdenProducto) {
		return this._create(facturaOrdenProducto);
	}

	/**
	 * Busca una asociación por su identificador dentro de la factura.
	 * @param {string} id identificador de la asociación
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	findById(id) {
		return this._findById(id);
	}

	/**
	 * Actualiza una asociación existente.
	 * @param {string} id identificador de la asociación
	 * @param {FacturaOrdenProducto} facturaOrdenProducto asociación actualizada
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	update(id, facturaOrdenProducto) {
		return this._update(id, facturaOrdenProducto);
	}

	/**
	 * Elimina una asociación por su identificador.
	 * @param {string} id identificador de la asociación
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	delete(id) {
		return this._delete(id);
	}
}

export default FacturaOrdenProductoDAO;
