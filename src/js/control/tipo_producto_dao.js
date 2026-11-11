import DefaultDAO from "./default_dao.js";

class TipoProductoDAO extends DefaultDAO {
    constructor() {
        super();
        this.URL += "tipoproducto/";
    }

    /**
     * Busca en un conjunto de registros de tipo de producto, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea un nuevo tipo de producto.
     * @param {TipoProducto} tipoProducto el tipo de producto a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(tipoProducto) {
        return this._create(tipoProducto);
    }

    /**
     * Busca un tipo de producto por su id.
     * @param {string} id id del tipo de producto a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza un tipo de producto por su id.
     * @param {string} id id del tipo de producto a actualizar
     * @param {TipoProducto} tipoProducto el tipo de producto con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, tipoProducto) {
        return this._update(id, tipoProducto);
    }

    /**
     * Elimina un tipo de producto por su id.
     * @param {string} id id del tipo de producto a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default TipoProductoDAO;