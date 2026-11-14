import EmpleadoDAO from "./empleado_dao.js";
import EmpleadoRolDAO from "./empleado_rol_dao.js";

const STORAGE_KEY = "cafefe_sesion_activa";

class SessionManager {
    constructor() {
        this.empleadoDAO = new EmpleadoDAO();
    }

    static clasificarCargo(nombreRol = "") {
        const limpio = nombreRol
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toUpperCase();

        if (limpio.includes("GERENTE") || limpio.includes("ADMIN") || limpio.includes("ENCARGADO")) {
            return "GERENTE";
        }
        if (limpio.includes("CAJ") || limpio.includes("TPV") || limpio.includes("PAGO")) {
            return "CAJERO";
        }
        if (limpio.includes("BARISTA") || limpio.includes("COCIN") || limpio.includes("PREPAR")) {
            return "BARISTA";
        }
        return "BARISTA";
    }

    async autenticarEmpleado(nombreIngresado, idEmpleadoIngresado, recordar = false) {
        const nombreLimpio = (nombreIngresado || "").trim().toLowerCase();
        const uuidLimpio = (idEmpleadoIngresado || "").trim().toLowerCase();

        if (!nombreLimpio || !uuidLimpio) {
            throw new Error("Ingresa tu nombre de empleado y tu identificador único (UUID).");
        }

        const respEmpleados = await this.empleadoDAO.findRange(0, 50);
        const listaEmpleados = Array.isArray(respEmpleados)
            ? respEmpleados
            : (respEmpleados?.datos || respEmpleados?.data || []);

        const empleado = listaEmpleados.find(emp => {
            const idMatch = String(emp.idEmpleado || "").trim().toLowerCase() === uuidLimpio;
            const nombreSolo = String(emp.nombre || "").trim().toLowerCase();
            const nombreCompleto = `${emp.nombre || ""} ${emp.apellido || ""}`.trim().toLowerCase();
            return idMatch && (nombreSolo === nombreLimpio || nombreCompleto === nombreLimpio);
        });

        if (!empleado) {
            throw new Error("El nombre o el identificador único (UUID) no coinciden con ningún empleado.");
        }

        if (empleado.activo === false) {
            throw new Error("Este empleado se encuentra inactivo en el sistema.");
        }

        const empleadoRolDAO = new EmpleadoRolDAO(empleado.idEmpleado);
        const respRoles = await empleadoRolDAO.findRange(0, 50);
        const listaRoles = Array.isArray(respRoles)
            ? respRoles
            : (respRoles?.datos || respRoles?.data || []);

        const rolesActivos = listaRoles.filter(er => er.activo !== false);

        if (rolesActivos.length === 0) {
            throw new Error("El empleado no tiene ningún cargo activo asignado.");
        }

        const cargosDetectados = rolesActivos.map(er => {
            const nombreRol = er.idRol?.nombre || er.nombreRol || "Barista";
            return {
                idEmpleadoRol: er.idEmpleadoRol,
                idRol: er.idRol?.idRol || null,
                nombreRol,
                tipoVista: SessionManager.clasificarCargo(nombreRol)
            };
        });

        let vistaInicial = "BARISTA";
        if (cargosDetectados.some(c => c.tipoVista === "GERENTE")) {
            vistaInicial = "GERENTE";
        } else if (cargosDetectados.some(c => c.tipoVista === "CAJERO")) {
            vistaInicial = "CAJERO";
        }

        const sesion = {
            modo: "EMPLEADO",
            idEmpleado: empleado.idEmpleado,
            nombre: empleado.nombre,
            apellido: empleado.apellido || "",
            nombreCompleto: `${empleado.nombre} ${empleado.apellido || ""}`.trim(),
            roles: cargosDetectados,
            idEmpleadoRolPrincipal: cargosDetectados[0].idEmpleadoRol,
            vistaInicial,
            fechaLogin: new Date().toISOString()
        };

        this.guardarSesion(sesion, recordar);
        return sesion;
    }

    iniciarModoCliente(nombreCliente = "") {
        const sesion = {
            modo: "CLIENTE",
            nombreCliente: (nombreCliente || "").trim(),
            vistaInicial: "PEDIDO",
            fechaLogin: new Date().toISOString()
        };
        this.guardarSesion(sesion, false);
        return sesion;
    }

    guardarSesion(sesion, persistente = false) {
        const serializado = JSON.stringify(sesion);
        sessionStorage.setItem(STORAGE_KEY, serializado);
        if (persistente) {
            localStorage.setItem(STORAGE_KEY, serializado);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    obtenerSesion() {
        const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            this.cerrarSesion();
            return null;
        }
    }

    cerrarSesion() {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
    }
}

export default SessionManager;