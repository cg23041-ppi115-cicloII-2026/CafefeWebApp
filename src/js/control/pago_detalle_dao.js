import DefaultDAO from "./default_dao.js";

class PagoDetalleDAO extends DefaultDAO {
	constructor(idPago) {
		super();
		this.URL += `pago/${idPago}/detalle/`;
	}

	/**
	 * Busca detalles de pago dentro de un rango paginado.
	 * @param {number} first primer registro a obtener
	 * @param {number} max cantidad máxima de registros a obtener
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	findRange(first, max) {
		return this._findRange(first, max);
	}

	/**
	 * Crea un detalle para este pago.
	 * @param {PagoDetalle} pagoDetalle el detalle de pago a crear
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	create(pagoDetalle) {
		return this._create(pagoDetalle);
	}

	/**
	 * Busca un detalle de pago por su id.
	 * @param {string} id id del detalle de pago
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	findById(id) {
		return this._findById(id);
	}

	/**
	 * Actualiza un detalle de pago existente.
	 * @param {string} id id del detalle de pago
	 * @param {PagoDetalle} pagoDetalle detalle con los datos actualizados
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	update(id, pagoDetalle) {
		return this._update(id, pagoDetalle);
	}

	/**
	 * Elimina un detalle de pago por su id.
	 * @param {string} id id del detalle de pago
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa con la respuesta o el error
	 */
	delete(id) {
		return this._delete(id);
	}
}

export default PagoDetalleDAO;
