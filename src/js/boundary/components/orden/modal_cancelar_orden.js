class ModalCancelarOrden extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._orden = null;
    }

    abrir(orden) {
        this._orden = orden;
        this._dibujar();
    }

    cerrar() {
        this._orden = null;
        this._root.innerHTML = "";
    }

    _dibujar() {
        if (!this._orden) return;
        const uidCorto = String(this._orden.idOrden || "0000").slice(-5).toUpperCase();

        this._root.innerHTML = `
            <style>
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(40, 25, 15, 0.65);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(2px);
                    animation: fadeIn 0.2s ease;
                    font-family: var(--fuente-principal, system-ui, -apple-system, sans-serif);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .modal-caja {
                    background: #ffffff;
                    border-radius: 14px;
                    padding: 1.5rem;
                    width: 90%;
                    max-width: 440px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
                    border: 1px solid var(--borde-suave, #d8c6a8);
                }

                .modal-caja h3 {
                    margin: 0 0 0.5rem 0;
                    color: var(--apple-red, #C8322B);
                    font-size: 1.2rem;
                }

                .modal-caja p {
                    margin: 0 0 1rem 0;
                    font-size: 0.9rem;
                    color: var(--texto-secundario, #6e5740);
                }

                .opciones-motivo {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .opciones-motivo label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--coffee-brown, #4B3621);
                    cursor: pointer;
                    padding: 6px 10px;
                    border-radius: 6px;
                    border: 1px solid #e0d5c8;
                    background-color: #faf6f0;
                }

                .opciones-motivo label:has(input:checked) {
                    border-color: var(--apple-red, #C8322B);
                    background-color: #fff0f0;
                    color: var(--apple-red, #C8322B);
                }

                .input-otro-motivo {
                    width: 100%;
                    box-sizing: border-box;
                    padding: 8px 10px;
                    border-radius: 6px;
                    border: 1px solid #d8c6a8;
                    font-family: inherit;
                    font-size: 0.88rem;
                    margin-top: 4px;
                }

                .modal-acciones {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                    margin-top: 1.25rem;
                }

                .btn-cancelar-dialog {
                    background-color: transparent;
                    border: 1px solid #8c735d;
                    color: #4B3621;
                    padding: 8px 14px;
                    border-radius: 6px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .btn-confirmar-cancelar {
                    background-color: var(--apple-red, #C8322B);
                    color: #ffffff;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .btn-confirmar-cancelar:hover {
                    background-color: #a82822;
                }
            </style>
            <div class="modal-overlay" id="overlayCancelar">
                <div class="modal-caja">
                    <h3>Cancelar Orden #${uidCorto}</h3>
                    <p>Selecciona el motivo de cancelación para registrar la auditoría:</p>
                    <div class="opciones-motivo">
                        <label>
                            <input type="radio" name="motivoCancelacion" value="Cliente se retiró" checked>
                            Cliente se retiró
                        </label>
                        <label>
                            <input type="radio" name="motivoCancelacion" value="Producto agotado">
                            Producto agotado
                        </label>
                        <label>
                            <input type="radio" name="motivoCancelacion" value="Error de caja">
                            Error de caja
                        </label>
                        <label>
                            <input type="radio" name="motivoCancelacion" value="otro">
                            Otro motivo...
                        </label>
                        <input type="text" id="inputOtroMotivo" class="input-otro-motivo" placeholder="Escribe el motivo..." style="display: none;">
                    </div>
                    <div class="modal-acciones">
                        <button type="button" class="btn-cancelar-dialog" id="btnCerrarModal">Volver</button>
                        <button type="button" class="btn-confirmar-cancelar" id="btnConfirmarCancelar">Confirmar Cancelación</button>
                    </div>
                </div>
            </div>
        `;

        const radios = this._root.querySelectorAll('input[name="motivoCancelacion"]');
        const inputOtro = this._root.querySelector("#inputOtroMotivo");
        radios.forEach(r => {
            r.addEventListener("change", (e) => {
                inputOtro.style.display = e.target.value === "otro" ? "block" : "none";
                if (e.target.value === "otro") inputOtro.focus();
            });
        });

        this._root.querySelector("#btnCerrarModal").addEventListener("click", () => {
            this.cerrar();
        });

        this._root.querySelector("#btnConfirmarCancelar").addEventListener("click", () => {
            const seleccionado = this._root.querySelector('input[name="motivoCancelacion"]:checked')?.value || "Cliente se retiró";
            let motivoFinal = seleccionado;
            if (seleccionado === "otro") {
                motivoFinal = inputOtro.value.trim() || "No especificado";
            }
            const ordenCancelada = this._orden;
            this.cerrar();

            this.dispatchEvent(new CustomEvent("confirmar-cancelacion", {
                detail: { orden: ordenCancelada, motivo: motivoFinal },
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("modal-cancelar-orden", ModalCancelarOrden);
export default ModalCancelarOrden;
