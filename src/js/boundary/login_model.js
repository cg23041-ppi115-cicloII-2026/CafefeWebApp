import './components/login/login_cafefe.js';
import SessionManager from '../control/session_manager.js';

class LoginModel extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.sessionManager = new SessionManager();
        this.sesionActual = null;
        this._loginComp = null;
    }

    connectedCallback() {
        this._dibujar();
    }

    _redirigirSegunSesion(sesion) {
        if (!sesion) return;

        this.dispatchEvent(new CustomEvent('sesion-iniciada', {
            detail: sesion,
            bubbles: true,
            composed: true
        }));

        if (sesion.modo === 'CLIENTE') {
            window.location.href = './pedido.html';
            return;
        }

        switch (sesion.vistaInicial) {
            case 'BARISTA':
                window.location.href = './orden.html';
                break;
            case 'CAJERO':
                window.location.href = './pago.html';
                break;
            case 'ADMINISTRADOR':
                window.location.href = './pago.html';
                break;
            case 'COCINERO':
                window.location.href = './orden.html';
                break;
            case 'GERENTE':
            default:
                window.location.href = './pedido.html';
                break;
           
        }
    }

    async _procesarLoginEmpleado({ nombre, idEmpleado, recordar }) {
        if (!this._loginComp || this._loginComp.cargando) return;
        this._loginComp.error = '';
        this._loginComp.cargando = true;

        try {
            const sesion = await this.sessionManager.autenticarEmpleado(
                nombre,
                idEmpleado,
                recordar
            );
            this.sesionActual = sesion;
            this._redirigirSegunSesion(sesion);
        } catch (err) {
            this._loginComp.error = err?.message || 'No se pudieron validar las credenciales.';
        } finally {
            if (this._loginComp) {
                this._loginComp.cargando = false;
            }
        }
    }

    _procesarAccesoCliente() {
        const sesionCliente = this.sessionManager.iniciarModoCliente();
        this.sesionActual = sesionCliente;
        this._redirigirSegunSesion(sesionCliente);
    }

    _dibujar() {
        this.root.innerHTML = '';

        const loginComp = document.createElement('login-cafefe');
        loginComp.setAttribute('logo', this.getAttribute('logo') || './resources/img/logo_cafe.png');

        loginComp.addEventListener('intentar-login', (e) => {
            this._procesarLoginEmpleado(e.detail);
        });

        loginComp.addEventListener('acceso-cliente', () => {
            this._procesarAccesoCliente();
        });

        this._loginComp = loginComp;
        this.root.appendChild(loginComp);
    }
}

customElements.define('login-model', LoginModel);
export default LoginModel;