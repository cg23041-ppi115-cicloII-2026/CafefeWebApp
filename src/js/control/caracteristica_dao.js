import DefaultDAO from "./default_dao.js";

class CaracteristicaDAO extends DefaultDAO {
    constructor() {
        super();
        this.URL += "caracteristica/";
    }

    /**
     * Busca en un conjunto de registros de característica, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea una nueva característica.
     * @param {Caracteristica} caracteristica la característica a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(caracteristica) {
        return this._create(caracteristica);
    }

    /**
     * Busca una característica por su id.
     * @param {string} id id de la característica a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza una característica por su id.
     * @param {string} id id de la característica a actualizar
     * @param {Caracteristica} caracteristica la característica con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, caracteristica) {
        return this._update(id, caracteristica);
    }

    /**
     * Elimina una característica por su id.
     * @param {string} id id de la característica a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default CaracteristicaDAO;