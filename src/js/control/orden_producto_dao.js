import DefaultDAO from "./default_dao.js";

class OrdenProductoDAO extends DefaultDAO {
    /**
     * @param {string} idOrden id de la orden a la que pertenecen los productos
     */
    constructor(idOrden) {
        super();
        this.URL += `orden/${idOrden}/producto/`;
    }

    /**
     * Busca en un conjunto de registros de producto de una orden, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Agrega un producto a la orden.
     * @param {OrdenProducto} ordenProducto el producto de la orden a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(ordenProducto) {
        return this._create(ordenProducto);
    }

    /**
     * Busca un producto de la orden por su id.
     * @param {string} id id del OrdenProducto a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza un producto de la orden por su id.
     * @param {string} id id del OrdenProducto a actualizar
     * @param {OrdenProducto} ordenProducto el producto de la orden con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, ordenProducto) {
        return this._update(id, ordenProducto);
    }

    /**
     * Elimina un producto de la orden por su id.
     * @param {string} id id del OrdenProducto a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default OrdenProductoDAO;