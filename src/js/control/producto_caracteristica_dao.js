import DefaultDAO from "./default_dao.js";

class ProductoCaracteristicaDAO extends DefaultDAO {
    /**
     * @param {string} idProducto id del producto al que pertenecen las características
     */
    constructor(idProducto) {
        super();
        this.URL += `producto/${idProducto}/caracteristica/`;
    }

    /**
     * Busca en un conjunto de registros de característica de un producto, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Asocia una característica al producto.
     * @param {ProductoCaracteristica} productoCaracteristica la característica del producto a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(productoCaracteristica) {
        return this._create(productoCaracteristica);
    }

    /**
     * Busca una característica del producto por su id.
     * @param {string} id id del ProductoCaracteristica a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza una característica del producto por su id.
     * @param {string} id id del ProductoCaracteristica a actualizar
     * @param {ProductoCaracteristica} productoCaracteristica la característica del producto con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, productoCaracteristica) {
        return this._update(id, productoCaracteristica);
    }

    /**
     * Elimina una característica del producto por su id.
     * @param {string} id id del ProductoCaracteristica a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default ProductoCaracteristicaDAO;