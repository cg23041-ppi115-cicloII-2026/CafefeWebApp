import DefaultDAO from "./default_dao.js";

class FacturaDAO extends DefaultDAO {
	constructor() {
		super();
		this.URL += "factura/";
	}

	/**
	 * Busca un rango de facturas.
	 * @param {number} first primer registro a obtener
	 * @param {number} max cantidad máxima de registros a obtener
	 * @returns {Promise<DefaultResponse, DefaultError>}
	 */
	findRange(first, max) {
		return this._findRange(first, max);
	}

	/**
	 * Crea una factura.
	 * @param {Factura} factura la factura a crear
	 * @returns {Promise<DefaultResponse, DefaultError>}
	 */
	create(factura) {
		return this._create(factura);
	}

	/**
	 * Busca una factura por su id.
	 * @param {string} id id de la factura
	 * @returns {Promise<DefaultResponse, DefaultError>}
	 */
	findById(id) {
		return this._findById(id);
	}

	/**
	 * Actualiza una factura por su id.
	 * @param {string} id id de la factura
	 * @param {Factura} factura datos actualizados de la factura
	 * @returns {Promise<DefaultResponse, DefaultError>}
	 */
	update(id, factura) {
		return this._update(id, factura);
	}

	/**
	 * Elimina una factura por su id.
	 * @param {string} id id de la factura
	 * @returns {Promise<DefaultResponse, DefaultError>}
	 */
	delete(id) {
		return this._delete(id);
	}
}

export default FacturaDAO;
