import DefaultDAO from "./default_dao.js";

class DescuentoProductoDAO extends DefaultDAO {
    /**
     * Constructor que fija la URL base para las operaciones de productos asociadas a un descuento específico.
     * @param {string} idDescuento ID del descuento contextuado
     */
    constructor(idDescuento) {
        super();
        this.URL += `descuento/${encodeURIComponent(idDescuento)}/producto/`;
    }

    /**
     * Busca productos asociados al descuento indicando el rango paginado.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad máxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>}
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea una relación descuento-producto para el descuento actual.
     * @param {DescuentoProducto} descuentoProducto la relación a crear
     * @returns {Promise<DefaultResponse, DefaultError>}
     */
    create(descuentoProducto) {
        return this._create(descuentoProducto);
    }

    /**
     * Busca una relación descuento-producto específica por su id.
     * @param {string} id id de la relación a buscar
     * @returns {Promise<DefaultResponse, DefaultError>}
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza una relación descuento-producto existente por su id.
     * @param {string} id id de la relación a actualizar
     * @param {DescuentoProducto} descuentoProducto la relación con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>}
     */
    update(id, descuentoProducto) {
        return this._update(id, descuentoProducto);
    }

    /**
     * Elimina una relación descuento-producto por su id.
     * @param {string} id id de la relación a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>}
     */
    delete(id) {
        return this._delete(id);
    }
}

export default DescuentoProductoDAO;