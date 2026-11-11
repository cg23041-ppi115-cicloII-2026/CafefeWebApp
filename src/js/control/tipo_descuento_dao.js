import DefaultDAO from "./default_dao.js";

class TipoDescuentoDAO extends DefaultDAO {
	constructor() {
		super();
		this.URL += "tipodescuento/";
	}

	/**
	 * Busca tipos de descuento indicando el primer registro y la cantidad máxima de registros a obtener.
	 * @param {number} first primer registro a obtener
	 * @param {number} max cantidad máxima de registros a obtener
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	findRange(first, max) {
		return this._findRange(first, max);
	}

	/**
	 * Crea un nuevo tipo de descuento.
	 * @param {TipoDescuento} tipoDescuento el tipo de descuento a crear
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	create(tipoDescuento) {
		return this._create(tipoDescuento);
	}

	/**
	 * Busca un tipo de descuento por su id.
	 * @param {string} id id del tipo de descuento a buscar
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	findById(id) {
		return this._findById(id);
	}

	/**
	 * Actualiza un tipo de descuento por su id.
	 * @param {string} id id del tipo de descuento a actualizar
	 * @param {TipoDescuento} tipoDescuento el tipo de descuento con los datos actualizados
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	update(id, tipoDescuento) {
		return this._update(id, tipoDescuento);
	}

	/**
	 * Elimina un tipo de descuento por su id.
	 * @param {string} id id del tipo de descuento a eliminar
	 * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
	 */
	delete(id) {
		return this._delete(id);
	}
}

export default TipoDescuentoDAO;
