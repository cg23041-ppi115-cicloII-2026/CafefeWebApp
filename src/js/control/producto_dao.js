import DefaultDAO from "./default_dao.js";

class ProductoDAO extends DefaultDAO {
    constructor() {
        super();
        this.URL += "producto/";
    }

    /**
     * Busca en un conjunto de registros de producto, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea un nuevo producto.
     * @param {Producto} producto el producto a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(producto) {
        return this._create(producto);
    }

    /**
     * Busca un producto por su id.
     * @param {string} id id del producto a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza un producto por su id.
     * @param {string} id id del producto a actualizar
     * @param {Producto} producto el producto con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, producto) {
        return this._update(id, producto);
    }

    /**
     * Elimina un producto por su id.
     * @param {string} id id del producto a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default ProductoDAO;