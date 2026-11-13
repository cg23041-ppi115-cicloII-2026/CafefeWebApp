class OrdenProceso extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._orden = null;
        this._productos = [];
    }

    set ordenActual(valor) {
        this._orden = valor?.orden || null;
        this._productos = Array.isArray(valor?.productos) ? valor.productos : [];
        this._dibujar();
    }

    connectedCallback() {
        this._dibujar();
    }

    _dibujar() {
        if (!this._orden) {
            this._root.innerHTML = `
                <link rel="stylesheet" href="./resources/estilos/components/orden_proceso.css">
                <div class="estado-vacio">
                    <p>No hay ningún pedido en preparación.</p>
                    <small>Selecciona <strong>"Tomar y Preparar"</strong> en la cola de pendientes.</small>
                </div>
            `;
            return;
        }

        const uidCorto = String(this._orden.idOrden || "0000").slice(-5).toUpperCase();
        const todosListos = this._productos.length > 0 && this._productos.every(p => p.listo);

        const listaHTML = this._productos.map((prod, idx) => `
            <label class="item-producto ${prod.listo ? "completado" : ""}">
                <input type="checkbox" data-index="${idx}" ${prod.listo ? "checked" : ""}>
                <div class="info-producto">
                    <div class="fila-superior">
                        <span class="nombre-producto">${prod.nombreProducto}</span>
                        <span class="precio-producto">$${Number(prod.precio || 0).toFixed(2)}</span>
                    </div>
                    ${prod.observaciones ? `<div class="observaciones">Nota: ${prod.observaciones}</div>` : ""}
                </div>
            </label>
        `).join("");

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/orden_proceso.css">
            <div class="panel-proceso">
                <div class="cabecera-proceso">
                    <div>
                        <span class="etiqueta-activa">PREPARANDO AHORA</span>
                        <h3>Orden #${uidCorto}</h3>
                    </div>
                    <span class="contador">${this._productos.filter(p => p.listo).length} / ${this._productos.length} listos</span>
                </div>

                <div class="lista-checklist">
                    ${listaHTML}
                </div>

                <div class="acciones-proceso">
                    <button type="button" class="btn-devolver" id="btnDevolver">Devolver a Cola</button>
                    <button type="button" class="btn-completar" id="btnCompletar" ${!todosListos ? "disabled" : ""}>
                        Pedido Listo
                    </button>
                    <button type="button" class="btn-cancelar-proceso" id="btnCancelar">
                        Cancelar Pedido
                    </button>
                </div>
            </div>
        `;

        this._root.querySelectorAll('input[type="checkbox"]').forEach(chk => {
            chk.addEventListener("change", (e) => {
                const index = Number(e.target.dataset.index);
                this._productos[index].listo = e.target.checked;
                this._dibujar();
            });
        });

        this._root.querySelector("#btnDevolver").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("devolver-orden", {
                detail: this._orden,
                bubbles: true,
                composed: true
            }));
        });

        this._root.querySelector("#btnCompletar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("orden-completada", {
                detail: this._orden,
                bubbles: true,
                composed: true
            }));
        });

        this._root.querySelector("#btnCancelar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("cancelar-orden", {
                detail: this._orden,
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("orden-proceso", OrdenProceso);
export default OrdenProceso;