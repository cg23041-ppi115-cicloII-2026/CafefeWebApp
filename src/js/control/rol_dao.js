import DefaultDAO from "./default_dao.js";

class RolDAO extends DefaultDAO {
    constructor() {
        super();
        this.URL += "rol/";
    }

    /**
     * Busca en un conjunto de registros de rol, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea un nuevo rol.
     * @param {Rol} rol el rol a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(rol) {
        return this._create(rol);
    }

    /**
     * Busca un rol por su id.
     * @param {string} id id del rol a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza un rol por su id.
     * @param {string} id id del rol a actualizar
     * @param {Rol} rol el rol con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, rol) {
        return this._update(id, rol);
    }

    /**
     * Elimina un rol por su id.
     * @param {string} id id del rol a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default RolDAO;