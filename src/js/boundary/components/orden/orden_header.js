class OrdenHeader extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this._dibujar();
    }

    _dibujar() {
        this._root.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                }

                .navbar {
                    background-color: var(--coffee-brown, #4B3621);
                    color: #ffffff;
                    padding: 0.9rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
                    box-sizing: border-box;
                    font-family: var(--fuente-principal, system-ui, -apple-system, sans-serif);
                }

                .navbar-marca {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .navbar-logo {
                    width: 38px;
                    height: 38px;
                    object-fit: contain;
                    border-radius: 50%;
                    background-color: var(--vanilla-beige, #EDE0C8);
                    padding: 4px;
                    flex-shrink: 0;
                }

                .navbar h1 {
                    margin: 0;
                    font-size: 1.3rem;
                    font-weight: 700;
                }

                .navbar-acciones {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .btn-historial {
                    background-color: transparent;
                    color: var(--vanilla-beige, #EDE0C8);
                    border: 1.5px solid var(--vanilla-beige, #EDE0C8);
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.88rem;
                    transition: all 0.2s ease;
                }

                .btn-historial:hover {
                    background-color: var(--vanilla-beige, #EDE0C8);
                    color: var(--coffee-brown, #4B3621);
                }

                .btn-refrescar {
                    background-color: #6f4e37;
                    color: #ffffff;
                    border: none;
                    padding: 9px 18px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 700;
                    font-size: 0.9rem;
                    transition: background-color 0.2s ease;
                }

                .btn-refrescar:hover {
                    background-color: #825d42;
                }
            </style>
            <header class="navbar">
                <div class="navbar-marca">
                    <img src="./resources/img/logo_cafe.png" alt="Logo Cafefe" class="navbar-logo">
                    <h1>Cafefe · Pantalla de Cocina y Barista</h1>
                </div>
                <div class="navbar-acciones">
                    <button type="button" class="btn-historial" id="btnHistorial">Ver Historial del Turno</button>
                    <button type="button" class="btn-refrescar" id="btnRefrescar">Actualizar Cola</button>
                </div>
            </header>
        `;

        this._root.querySelector("#btnHistorial").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("abrir-historial", {
                bubbles: true,
                composed: true
            }));
        });

        this._root.querySelector("#btnRefrescar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("refrescar-cola", {
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("orden-header", OrdenHeader);
export default OrdenHeader;
