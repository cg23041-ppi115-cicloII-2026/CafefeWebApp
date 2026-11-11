import DefaultDAO from "./default_dao.js";

class OrdenDAO extends DefaultDAO {
    constructor() {
        super();
        this.URL += "orden/";
    }

    /**
     * Busca en un conjunto de registros de orden, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea una nueva orden.
     * @param {Orden} orden la orden a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(orden) {
        return this._create(orden);
    }

    /**
     * Busca una orden por su id.
     * @param {string} id id de la orden a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza una orden por su id.
     * @param {string} id id de la orden a actualizar
     * @param {Orden} orden la orden con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, orden) {
        return this._update(id, orden);
    }

    /**
     * Elimina una orden por su id.
     * @param {string} id id de la orden a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default OrdenDAO;