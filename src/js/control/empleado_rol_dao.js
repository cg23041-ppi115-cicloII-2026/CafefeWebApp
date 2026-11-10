import DefaultDAO from "./default_dao.js";

class EmpleadoRolDAO extends DefaultDAO {
    constructor(idEmpleado) {
        super();
        this.URL += `empleado/${idEmpleado}/rol/`;
    }

    /**
     * Busca en un conjunto de registros de empleado rol para un empleado específico, indicando el rango paginado.
     * @param {number} first primer registro a obtener
     * @param {number} max cantidad máxima de registros a obtener
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findRange(first, max) {
        return this._findRange(first, max);
    }

    /**
     * Crea un nuevo empleado rol asignado a un empleado.
     * @param {EmpleadoRol} empleadoRol el empleado rol a crear
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    create(empleadoRol) {
        return this._create(empleadoRol);
    }

    /**
     * Busca una asignación de empleado rol específica por su id.
     * @param {string} id id de la asignación empleado rol a buscar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    findById(id) {
        return this._findById(id);
    }

    /**
     * Actualiza una asignación de empleado rol existente por su id.
     * @param {string} id id del empleado rol a actualizar
     * @param {EmpleadoRol} empleadoRol el empleado rol con los datos actualizados
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    update(id, empleadoRol) {
        return this._update(id, empleadoRol);
    }

    /**
     * Elimina la asignación de un rol a un empleado por su id.
     * @param {string} id id del empleado rol a eliminar
     * @returns {Promise<DefaultResponse, DefaultError>} una promesa que se resuelve con un DefaultResponse o se rechaza con un DefaultError
     */
    delete(id) {
        return this._delete(id);
    }
}

export default EmpleadoRolDAO;