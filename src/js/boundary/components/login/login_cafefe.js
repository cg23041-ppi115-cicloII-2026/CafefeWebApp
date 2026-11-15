class LoginCafefe extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this._cargando = false;
        this._mensajeError = "";
    }

    static get observedAttributes() {
        return ["logo"];
    }

    set cargando(valor) {
        this._cargando = Boolean(valor);
        this._actualizarEstadoBoton();
    }

    get cargando() {
        return this._cargando;
    }

    set error(mensaje) {
        this._mensajeError = mensaje || "";
        this._renderizarAlerta();
    }

    connectedCallback() {
        this._dibujar();
    }

    _renderizarAlerta() {
        const alerta = this.root.querySelector("#alertaLogin");
        if (!alerta) return;

        if (this._mensajeError) {
            alerta.textContent = this._mensajeError;
            alerta.classList.remove("oculto");
        } else {
            alerta.textContent = "";
            alerta.classList.add("oculto");
        }
    }

    _actualizarEstadoBoton() {
        const btnSubmit = this.root.querySelector("#btnSubmitLogin");
        if (!btnSubmit) return;
        btnSubmit.disabled = this._cargando;
        btnSubmit.textContent = this._cargando ? "Verificando..." : "Iniciar Sesión";
    }

    _dibujar() {
        const logoSrc = this.getAttribute("logo") || "./resources/img/logo_cafe.png";

        this.root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/login_cafefe.css">
            <div class="login-wrapper">
                <!-- Panel izquierdo de marca -->
                <div class="login-brand-panel">
                    <img src="${logoSrc}" alt="" class="watermark-logo" aria-hidden="true">
                    <div class="brand-content">
                        <img src="${logoSrc}" alt="Logo Cafefe" class="brand-logo-main">
                        <h1 class="brand-title">Cafefe</h1>
                        <p class="brand-subtitle">Cafetería Artesanal · Sistema de Pedidos y Estaciones</p>
                    </div>
                </div>

                <!-- Panel derecho de formulario -->
                <div class="login-form-panel">
                    <div class="login-card">
                        <div class="login-header">
                            <h2>Acceso de Personal</h2>
                            <p>Ingresa tu nombre y tu identificador único de empleado</p>
                        </div>

                        <div id="alertaLogin" class="alerta-login oculto" role="alert"></div>

                        <form id="formLoginCafefe" novalidate>
                            <div class="campo-grupo">
                                <label for="inputNombreEmpleado">Nombre de empleado</label>
                                <input
                                    type="text"
                                    id="inputNombreEmpleado"
                                    placeholder="Ej. Ana García"
                                    autocomplete="name"
                                    required
                                >
                            </div>

                            <div class="campo-grupo">
                                <label for="inputUuidEmpleado">Identificador único (UUID)</label>
                                <div class="input-password-box">
                                    <input
                                        type="password"
                                        id="inputUuidEmpleado"
                                        placeholder="Ingresa tu UUID"
                                        autocomplete="off"
                                        required
                                    >
                                    <button type="button" id="btnToggleUuid" class="btn-toggle-eye" aria-label="Mostrar u ocultar UUID">
                                        Mostrar
                                    </button>
                                </div>
                            </div>

                            <div class="opciones-fila">
                                <label class="check-recordar">
                                    <input type="checkbox" id="chkRecordarSesion">
                                    <span>Recordar sesión en este dispositivo</span>
                                </label>
                            </div>

                            <button type="submit" id="btnSubmitLogin" class="btn-login-submit">
                                Iniciar Sesión
                            </button>
                        </form>

                        <div class="divisor-acceso">
                            <span>o si deseas ordenar</span>
                        </div>

                        <button type="button" id="btnAccesoCliente" class="btn-cliente-directo">
                            Hacer Pedido como Cliente
                        </button>
                    </div>
                </div>
            </div>
        `;

        const form = this.root.querySelector("#formLoginCafefe");
        const inputNombre = this.root.querySelector("#inputNombreEmpleado");
        const inputUuid = this.root.querySelector("#inputUuidEmpleado");
        const chkRecordar = this.root.querySelector("#chkRecordarSesion");
        const btnToggleUuid = this.root.querySelector("#btnToggleUuid");
        const btnAccesoCliente = this.root.querySelector("#btnAccesoCliente");

      btnToggleUuid.addEventListener("click", () => {
    const esPassword = inputUuid.type === "password";
    inputUuid.type = esPassword ? "text" : "password";
    btnToggleUuid.textContent = esPassword ? "Ocultar" : "Mostrar";
});

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.error = "";

            this.dispatchEvent(new CustomEvent("intentar-login", {
                detail: {
                    nombre: inputNombre.value,
                    idEmpleado: inputUuid.value,
                    recordar: chkRecordar.checked
                },
                bubbles: true,
                composed: true
            }));
        });

        btnAccesoCliente.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("acceso-cliente", {
                bubbles: true,
                composed: true
            }));
        });

        this._renderizarAlerta();
        this._actualizarEstadoBoton();
    }
}

customElements.define("login-cafefe", LoginCafefe);
export default LoginCafefe;