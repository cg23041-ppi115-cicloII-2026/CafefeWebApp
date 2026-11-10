import DefaultDAO from "./default_dao.js";

class EmpleadoDAO extends DefaultDAO {
    constructor() {
        super();
        this.URL += "empleado/";
    }

    /**
     * Busca en un conjunto de registros de empleado, especificando el primer registro a obtener y la cantidad maxima de registros a obtener.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad maxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea un nuevo empleado.
     * @param {Empleado} empleado el empleado a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(empleado) {
        return this._create(empleado);
    }

    /**
     * Busca un empleado por su id.
     * @param {string} id id del empleado a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza un empleado por su id.
     * @param {string} id id del empleado a actualizar
     * @param {Empleado} empleado el empleado con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, empleado) {
        return this._update(id, empleado);
    }

    /**
     * Elimina un empleado por su id.
     * @param {string} id id del empleado a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default EmpleadoDAO;