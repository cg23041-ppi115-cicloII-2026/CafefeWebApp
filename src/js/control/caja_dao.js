import DefaultDAO from "./default_dao.js";

class CajaDAO extends DefaultDAO {
    constructor() {
        super();
        this.URL += "caja/";
    }

    /**
     * Busca en un conjunto de registros de caja, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea una nueva caja.
     * @param {Caja} caja la caja a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(caja) {
        return this._create(caja);
    }

    /**
     * Busca una caja por su id.
     * @param {string} id id de la caja a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza una caja por su id.
     * @param {string} id id de la caja a actualizar
     * @param {Caja} caja la caja con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, caja) {
        return this._update(id, caja);
    }

    /**
     * Elimina una caja por su id.
     * @param {string} id id de la caja a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default CajaDAO;