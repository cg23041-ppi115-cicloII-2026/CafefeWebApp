import DefaultDAO from "./default_dao.js";

class ProductoTipoProductoDAO extends DefaultDAO {
    /**
     * @param {string} idProducto id del producto al que pertenecen los tipos de producto
     */
    constructor(idProducto) {
        super();
        this.URL += `producto/${idProducto}/tipoproducto/`;
    }

    /**
     * Busca en un conjunto de registros de tipo de producto de un producto, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Asocia un tipo de producto al producto.
     * @param {ProductoTipoProducto} productoTipoProducto el tipo de producto del producto a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(productoTipoProducto) {
        return this._create(productoTipoProducto);
    }

    /**
     * Busca un tipo de producto del producto por su id.
     * @param {string} id id del ProductoTipoProducto a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza un tipo de producto del producto por su id.
     * @param {string} id id del ProductoTipoProducto a actualizar
     * @param {ProductoTipoProducto} productoTipoProducto el tipo de producto del producto con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, productoTipoProducto) {
        return this._update(id, productoTipoProducto);
    }

    /**
     * Elimina un tipo de producto del producto por su id.
     * @param {string} id id del ProductoTipoProducto a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default ProductoTipoProductoDAO;