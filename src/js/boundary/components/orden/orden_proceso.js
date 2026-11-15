import "./badge_tiempo_orden.js";

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

    _actualizarProgreso() {
        const listos = this._productos.filter(p => p.listo).length;
        const total = this._productos.length;
        const contador = this._root.querySelector("#contadorListos");
        const btnCompletar = this._root.querySelector("#btnCompletar");

        if (contador) contador.textContent = `${listos} / ${total} listos`;
        if (btnCompletar) btnCompletar.disabled = total === 0 || listos < total;
    }

    _emitirAccion(evento) {
        this.dispatchEvent(new CustomEvent(evento, {
            detail: this._orden,
            bubbles: true,
            composed: true
        }));
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
        const tituloCliente = this._orden.clienteNombre
            ? `Orden #${uidCorto} — ${this._orden.clienteNombre}`
            : `Orden #${uidCorto}`;

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/orden_proceso.css">
            <div class="panel-proceso">
                <div class="cabecera-proceso">
                    <div>
                        <div class="cabecera-badges">
                            <span class="etiqueta-activa">PREPARANDO AHORA</span>
                            <badge-tiempo-orden id="badgeTiempo" prefijo="⏱ En espera:"></badge-tiempo-orden>
                        </div>
                        <h3 id="tituloOrden"></h3>
                    </div>
                    <span class="contador" id="contadorListos"></span>
                </div>

                <div class="lista-checklist" id="listaChecklist"></div>

                <div class="acciones-proceso">
                    <button type="button" class="btn-cancelar-proceso" id="btnCancelar">Cancelar Pedido</button>
                    <button type="button" class="btn-devolver" id="btnDevolver">Devolver a Cola</button>
                    <button type="button" class="btn-completar" id="btnCompletar">Pedido Listo</button>
                </div>
            </div>
        `;

        this._root.querySelector("#tituloOrden").textContent = tituloCliente;
        const badge = this._root.querySelector("#badgeTiempo");
        if (badge) badge.fecha = this._orden.fechaCreacion || this._orden.fecha_creacion;

        const checklist = this._root.querySelector("#listaChecklist");
        const fragment = document.createDocumentFragment();

        this._productos.forEach((prod, idx) => {
            const label = document.createElement("label");
            label.className = `item-producto ${prod.listo ? "completado" : ""}`;

            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.checked = Boolean(prod.listo);
            chk.dataset.index = idx;

            const info = document.createElement("div");
            info.className = "info-producto";

            const fila = document.createElement("div");
            fila.className = "fila-superior";

            const nombre = document.createElement("span");
            nombre.className = "nombre-producto";
            nombre.textContent = prod.nombreProducto;

            const precio = document.createElement("span");
            precio.className = "precio-producto";
            precio.textContent = `$${Number(prod.precio || 0).toFixed(2)}`;

            fila.append(nombre, precio);
            info.appendChild(fila);

            if (prod.observacionesLimpias) {
                const obs = document.createElement("div");
                obs.className = "observaciones";
                obs.textContent = `Nota: ${prod.observacionesLimpias}`;
                info.appendChild(obs);
            }

            label.append(chk, info);
            fragment.appendChild(label);
        });

        checklist.appendChild(fragment);
        this._actualizarProgreso();

        // Delegación única de eventos sin destruir el DOM al hacer clic
        checklist.addEventListener("change", (e) => {
            if (e.target.matches('input[type="checkbox"]')) {
                const idx = Number(e.target.dataset.index);
                this._productos[idx].listo = e.target.checked;
                e.target.closest(".item-producto").classList.toggle("completado", e.target.checked);
                this._actualizarProgreso();
            }
        });

        this._root.querySelector("#btnCancelar").addEventListener("click", () => this._emitirAccion("cancelar-orden"));
        this._root.querySelector("#btnDevolver").addEventListener("click", () => this._emitirAccion("devolver-orden"));
        this._root.querySelector("#btnCompletar").addEventListener("click", () => this._emitirAccion("orden-completada"));
    }
}

customElements.define("orden-proceso", OrdenProceso);
export default OrdenProceso;