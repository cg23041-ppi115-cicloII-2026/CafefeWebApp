import SessionManager from "../../../control/session_manager.js";
import "../mensaje_error.js";

class LoginCafefe extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._sessionManager = new SessionManager();
        this._logoSrc = "./resources/img/logo_cafe.png";
        this._cargando = false;
        this._mostrarUuid = false;
        this._estructuraCreada = false;
    }

    static get observedAttributes() {
        return ["logo"];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === "logo" && oldVal !== newVal && newVal) {
            this._logoSrc = newVal;
            this._actualizarLogos();
        }
    }

    connectedCallback() {
        if (this.hasAttribute("logo")) {
            this._logoSrc = this.getAttribute("logo");
        }
        this._dibujar();
    }

    _actualizarLogos() {
        const watermark = this._root.getElementById("logoWatermark");
        const insignia = this._root.getElementById("logoInsignia");
        if (watermark) watermark.src = this._logoSrc;
        if (insignia) insignia.src = this._logoSrc;
    }

    _toggleVerUuid() {
        this._mostrarUuid = !this._mostrarUuid;
        const inputUuid = this._root.getElementById("inputIdEmpleado");
        const btnVer = this._root.getElementById("btnToggleUuid");
        if (inputUuid) {
            inputUuid.type = this._mostrarUuid ? "text" : "password";
        }
        if (btnVer) {
            btnVer.textContent = this._mostrarUuid ? "Ocultar" : "Mostrar";
            btnVer.setAttribute("aria-pressed", String(this._mostrarUuid));
        }
    }

    _mostrarError(mensaje) {
        const zonaError = this._root.getElementById("zonaErrorLogin");
        if (!zonaError) return;
        zonaError.innerHTML = "";
        if (!mensaje) return;

        const alerta = document.createElement("mensaje-error");
        alerta.titulo = "No se pudo iniciar sesión";
        alerta.error = mensaje;
        alerta.addEventListener("cerrar-error", () => {
            zonaError.innerHTML = "";
        });
        zonaError.appendChild(alerta);
    }

    async _manejarSubmit(e) {
        e.preventDefault();
        if (this._cargando) return;

        const inputNombre = this._root.getElementById("inputNombre");
        const inputUuid = this._root.getElementById("inputIdEmpleado");
        const checkRecordar = this._root.getElementById("checkRecordar");
        const btnIngresar = this._root.getElementById("btnIngresar");

        const nombre = inputNombre ? inputNombre.value : "";
        const idEmpleado = inputUuid ? inputUuid.value : "";
        const recordar = checkRecordar ? checkRecordar.checked : false;

        this._mostrarError(null);
        this._cargando = true;
        if (btnIngresar) {
            btnIngresar.disabled = true;
            btnIngresar.textContent = "Verificando credenciales...";
        }

        try {
            const sesion = await this._sessionManager.autenticarEmpleado(nombre, idEmpleado, recordar);
            this.dispatchEvent(new CustomEvent("login-exitoso", {
                detail: sesion,
                bubbles: true,
                composed: true
            }));
        } catch (err) {
            this._mostrarError(err.message || "Error al validar credenciales.");
        } finally {
            this._cargando = false;
            if (btnIngresar) {
                btnIngresar.disabled = false;
                btnIngresar.textContent = "Ingresar al Sistema";
            }
        }
    }

    _manejarAccesoCliente() {
        const sesionCliente = this._sessionManager.iniciarModoCliente();
        this.dispatchEvent(new CustomEvent("acceso-cliente", {
            detail: sesionCliente,
            bubbles: true,
            composed: true
        }));
    }

    _dibujar() {
        if (this._estructuraCreada) return;

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/login_cafefe.css">
            <section class="login-split" aria-label="Inicio de sesión Cafefe">
                <div class="panel-marca">
                    <img
                        id="logoWatermark"
                        src="${this._logoSrc}"
                        alt=""
                        aria-hidden="true"
                        class="logo-watermark"
                    >

                    <div class="marca-contenido">
                        <div class="logo-badge">
                            <img
                                id="logoInsignia"
                                src="${this._logoSrc}"
                                alt="Logo Cafefe"
                                class="logo-principal"
                            >
                        </div>
                        <h1 class="marca-titulo">CAFEFE</h1>
                        <p class="marca-subtitulo">Punto de Venta y Pedidos</p>
                        <p class="marca-descripcion">
                            Gestiona órdenes en barra, cobros en caja y pedidos de clientes en tiempo real.
                        </p>
                    </div>

                    <div class="marca-pie">
                        <span class="cliente-hint">¿Vienes a ordenar? No necesitas cuenta</span>
                        <button type="button" id="btnAccesoCliente" class="btn-cliente">
                            Hacer Pedido como Cliente
                        </button>
                    </div>
                </div>

                <div class="panel-formulario">
                    <div class="form-contenedor">
                        <header class="form-cabecera">
                            <span class="etiqueta-rol">Estación de Trabajo</span>
                            <h2 class="form-titulo">Acceso de Personal</h2>
                            <p class="form-instruccion">
                                Ingresa tu nombre y tu identificador único de empleado para abrir tu estación asignada.
                            </p>
                        </header>

                        <div id="zonaErrorLogin" class="zona-error"></div>

                        <form id="formLoginEmpleado" class="login-form" novalidate>
                            <div class="campo-grupo">
                                <label for="inputNombre" class="campo-label">Nombre del Empleado</label>
                                <input
                                    type="text"
                                    id="inputNombre"
                                    name="nombre"
                                    class="campo-input"
                                    placeholder="Ej. Laura"
                                    autocomplete="username"
                                    required
                                >
                            </div>

                            <div class="campo-grupo">
                                <label for="inputIdEmpleado" class="campo-label">ID de Empleado (UUID)</label>
                                <div class="input-uuid-wrap">
                                    <input
                                        type="password"
                                        id="inputIdEmpleado"
                                        name="idEmpleado"
                                        class="campo-input input-con-boton"
                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                        autocomplete="current-password"
                                        required
                                    >
                                    <button
                                        type="button"
                                        id="btnToggleUuid"
                                        class="btn-ver-uuid"
                                        aria-pressed="false"
                                    >
                                        Mostrar
                                    </button>
                                </div>
                            </div>

                            <label class="checkbox-fila" for="checkRecordar">
                                <input type="checkbox" id="checkRecordar" class="checkbox-input">
                                <span>Mantener sesión activa</span>
                            </label>

                            <button type="submit" id="btnIngresar" class="btn-ingresar">
                                Ingresar al Sistema
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        `;

        this._root.getElementById("formLoginEmpleado")
            .addEventListener("submit", (e) => this._manejarSubmit(e));

        this._root.getElementById("btnToggleUuid")
            .addEventListener("click", () => this._toggleVerUuid());

        this._root.getElementById("btnAccesoCliente")
            .addEventListener("click", () => this._manejarAccesoCliente());

        this._estructuraCreada = true;
    }
}

customElements.define("login-cafefe", LoginCafefe);
export default LoginCafefe;