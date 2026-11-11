import DefaultDAO from "./default_dao.js";

class TipoCaracteristicaDAO extends DefaultDAO {
    constructor() {
        super();
        this.URL += "tipocaracteristica/";
    }

    /**
     * Busca en un conjunto de registros de tipo de característica, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea un nuevo tipo de característica.
     * @param {TipoCaracteristica} tipoCaracteristica el tipo de característica a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(tipoCaracteristica) {
        return this._create(tipoCaracteristica);
    }

    /**
     * Busca un tipo de característica por su id.
     * @param {string} id id del tipo de característica a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza un tipo de característica por su id.
     * @param {string} id id del tipo de característica a actualizar
     * @param {TipoCaracteristica} tipoCaracteristica el tipo de característica con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, tipoCaracteristica) {
        return this._update(id, tipoCaracteristica);
    }

    /**
     * Elimina un tipo de característica por su id.
     * @param {string} id id del tipo de característica a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default TipoCaracteristicaDAO;