class BotonGuardarOrden extends HTMLElement {
    static get observedAttributes() {
        return ['cantidad', 'texto', 'disabled'];
    }

    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this._dibujar();
    }

    attributeChangedCallback() {
        if (this._root.innerHTML) {
            this._dibujar();
        }
    }

    _dibujar() {
        const cantidad = Number(this.getAttribute('cantidad') || 0);
        const textoBase = this.getAttribute('texto') || 'Guardar';
        const deshabilitado = this.hasAttribute('disabled');
        const etiqueta = cantidad > 0 ? `${textoBase} (${cantidad})` : textoBase;

        this._root.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }

                .btn-guardar-orden {
                    padding: 0.65rem 1.35rem;
                    border: none;
                    border-radius: 999px;
                    background-color: var(--color-acento, #C8322B);
                    color: var(--texto-claro, #FFFFFF);
                    font-family: inherit;
                    font-size: 0.95rem;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: var(--sombra-suave, 0 2px 6px rgba(75, 54, 33, 0.14));
                    transition: background-color 0.2s ease, transform 0.15s ease;
                    white-space: nowrap;
                }

                .btn-guardar-orden:hover:not(:disabled) {
                    background-color: var(--color-acento-hover, #a82822);
                    transform: translateY(-1px);
                }

                .btn-guardar-orden:active:not(:disabled) {
                    transform: translateY(0);
                }

                .btn-guardar-orden:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    :host {
                        width: 100%;
                    }
                    .btn-guardar-orden {
                        width: 100%;
                    }
                }
            </style>
            <button
                type="button"
                class="btn-guardar-orden"
                id="btnGuardarOrden"
                ${deshabilitado ? 'disabled' : ''}>
                ${etiqueta}
            </button>
        `;

        this._root.getElementById('btnGuardarOrden').addEventListener('click', () => {
            if (deshabilitado) return;
            this.dispatchEvent(new CustomEvent('guardar-orden', {
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define('boton-guardar-orden', BotonGuardarOrden);
export default BotonGuardarOrden;