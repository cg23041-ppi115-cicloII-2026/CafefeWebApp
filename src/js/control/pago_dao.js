import DefaultDAO from "./default_dao.js";

class PagoDAO extends DefaultDAO {
	constructor() {
		super();
		this.URL += "pago/";
	}

	/**
	 * Busca en un conjunto de registros de pago, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
	 * @param {number} first primer registro a obtener
	 * @param {number} max cantidad maxima de registros a obtener
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	findRange(first, max) {
		return this._findRange(first, max);
	}

	/**
	 * Crea un nuevo pago.
	 * @param {Pago} pago el pago a crear
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	create(pago) {
		return this._create(pago);
	}

	/**
	 * Busca un pago por su id.
	 * @param {string} id id del pago a buscar
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	findById(id) {
		return this._findById(id);
	}

	/**
	 * Actualiza un pago por su id.
	 * @param {string} id id del pago a actualizar
	 * @param {Pago} pago el pago con los datos actualizados
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	update(id, pago) {
		return this._update(id, pago);
	}

	/**
	 * Elimina un pago por su id.
	 * @param {string} id id del pago a eliminar
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	delete(id) {
		return this._delete(id);
	}
}

export default PagoDAO;
