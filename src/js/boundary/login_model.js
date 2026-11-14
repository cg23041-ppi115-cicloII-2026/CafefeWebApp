import './components/login/login_cafefe.js';
import './components/mensaje_error.js';

import SessionManager from '../control/session_manager.js';

class LoginModel extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });

        this.sessionManager = new SessionManager();
        this.cargando = false;
        this.sesionActual = null;
    }

    async connectedCallback() {
        this.sesionActual = this.sessionManager.obtenerSesion();

        // Si un empleado ya tenía sesión guardada, redirigir directamente a su estación
        if (this.sesionActual && this.sesionActual.modo === 'EMPLEADO') {
            this._redirigirSegunSesion(this.sesionActual);
            return;
        }

        this._dibujar();
    }

    _mostrarError(titulo, err, accionReintentar = null) {
        const zona = this.root.querySelector('#zonaErrores');
        if (!zona) return;
        zona.innerHTML = '';

        const alerta = document.createElement('mensaje-error');
        alerta.titulo = titulo;
        alerta.error = err;
        alerta.reintentable = typeof accionReintentar === 'function';

        if (accionReintentar) {
            alerta.addEventListener('reintentar-operacion', () => {
                this._limpiarError();
                accionReintentar();
            });
        }

        zona.appendChild(alerta);
    }

    _limpiarError() {
        const zona = this.root.querySelector('#zonaErrores');
        if (zona) zona.innerHTML = '';
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
                window.location.href = './barista.html';
                break;
            case 'CAJERO':
                window.location.href = './caja.html';
                break;
            case 'GERENTE':
            default:
                window.location.href = './pedido.html';
                break;
        }
    }

    _dibujar() {
        this.root.innerHTML = '';

        const zonaErrores = document.createElement('div');
        zonaErrores.id = 'zonaErrores';
        this.root.appendChild(zonaErrores);

        if (this.cargando) {
            const p = document.createElement('p');
            p.style.cssText = 'text-align:center; padding:3rem; color:#4B3621;';
            p.textContent = 'Verificando credenciales...';
            this.root.appendChild(p);
            return;
        }

        const loginComp = document.createElement('login-cafefe');
        loginComp.setAttribute('logo', this.getAttribute('logo') || './resources/img/logo_cafe.png');

        loginComp.addEventListener('login-exitoso', (e) => {
            this._limpiarError();
            this.sesionActual = e.detail;
            this._redirigirSegunSesion(this.sesionActual);
        });

        loginComp.addEventListener('acceso-cliente', (e) => {
            this._limpiarError();
            this.sesionActual = e.detail;
            this._redirigirSegunSesion(this.sesionActual);
        });

        loginComp.addEventListener('login-error', (e) => {
            this._mostrarError('Error de inicio de sesión', e.detail);
        });

        this.root.appendChild(loginComp);
    }
}

customElements.define('login-model', LoginModel);
export default LoginModel;