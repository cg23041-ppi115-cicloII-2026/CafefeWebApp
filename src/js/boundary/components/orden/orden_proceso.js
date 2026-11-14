class OrdenProceso extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._orden = null;
        this._productos = [];
        this._intervaloTiempo = null;
    }

    set ordenActual(valor) {
        this._orden = valor?.orden || null;
        this._productos = Array.isArray(valor?.productos) ? valor.productos : [];
        this._dibujar();
        this._iniciarTimer();
    }

    connectedCallback() {
        this._dibujar();
        this._iniciarTimer();
    }

    disconnectedCallback() {
        if (this._intervaloTiempo) clearInterval(this._intervaloTiempo);
    }

    _iniciarTimer() {
        if (this._intervaloTiempo) clearInterval(this._intervaloTiempo);
        if (!this._orden) return;
        this._intervaloTiempo = setInterval(() => {
            this._actualizarTiempo();
        }, 30000);
    }

    _parsearFecha(fecha) {
        if (!fecha) return null;
        if (Array.isArray(fecha)) {
            const [anio, mes, dia, hora = 0, min = 0, seg = 0] = fecha;
            return new Date(anio, mes - 1, dia, hora, min, seg);
        }
        const limpia = String(fecha).trim().replace(/\[.*\]$/, "");
        const d = new Date(limpia);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    _calcularTiempoPreparacion() {
        const fecha = this._orden?.fechaCreacion || this._orden?.fecha_creacion;
        const creacion = this._parsearFecha(fecha);
        if (!creacion) return { texto: "", clase: "" };

        const diffMs = Date.now() - creacion.getTime();
        const diffMin = Math.max(0, Math.floor(diffMs / 60000));
        const texto = diffMin === 0 ? "Recién tomada (< 1 min)" : `En espera: ${diffMin} min`;

        let clase = "tiempo-verde";
        if (diffMin >= 15) clase = "tiempo-rojo";
        else if (diffMin >= 8) clase = "tiempo-amarillo";

        return { texto, clase };
    }

    _actualizarTiempo() {
        const badge = this._root.querySelector("#badgeTiempoProceso");
        if (!badge) return;
        const { texto, clase } = this._calcularTiempoPreparacion();
        if (texto) {
            badge.textContent = `⏱ ${texto}`;
            badge.className = `tiempo-proceso ${clase}`;
        }
    }

    _limpiarNota(obs = "") {
        return String(obs || "")
            .replace(/\s*\|\s*\[ESTADO:[^\]]*\]/g, "")
            .replace(/^\[ESTADO:[^\]]*\]\s*\|?\s*/g, "")
            .trim();
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
        const { texto: textoTiempo, clase: claseTiempo } = this._calcularTiempoPreparacion();
        const tiempoHTML = textoTiempo
            ? `<span id="badgeTiempoProceso" class="tiempo-proceso ${claseTiempo}">⏱ ${textoTiempo}</span>`
            : "";

        const listaHTML = this._productos.map((prod, idx) => {
            const nota = prod.observacionesLimpias ?? this._limpiarNota(prod.observaciones);
            return `
                <label class="item-producto ${prod.listo ? "completado" : ""}">
                    <input type="checkbox" data-index="${idx}" ${prod.listo ? "checked" : ""}>
                    <div class="info-producto">
                        <div class="fila-superior">
                            <span class="nombre-producto">${prod.nombreProducto}</span>
                            <span class="precio-producto">$${Number(prod.precio || 0).toFixed(2)}</span>
                        </div>
                        ${nota ? `<div class="observaciones">Nota: ${nota}</div>` : ""}
                    </div>
                </label>
            `;
        }).join("");

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/orden_proceso.css">
            <div class="panel-proceso">
                <div class="cabecera-proceso">
                    <div>
                        <div class="cabecera-badges">
                            <span class="etiqueta-activa">PREPARANDO AHORA</span>
                            ${tiempoHTML}
                        </div>
                        <h3>Orden #${uidCorto}</h3>
                    </div>
                    <span class="contador">${this._productos.filter(p => p.listo).length} / ${this._productos.length} listos</span>
                </div>

                <div class="lista-checklist">
                    ${listaHTML}
                </div>

                <div class="acciones-proceso">
                    <button type="button" class="btn-cancelar-proceso" id="btnCancelar">
                        Cancelar Pedido
                    </button>
                    <button type="button" class="btn-devolver" id="btnDevolver">
                        Devolver a Cola
                    </button>
                    <button type="button" class="btn-completar" id="btnCompletar" ${!todosListos ? "disabled" : ""}>
                        Pedido Listo
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

        this._root.querySelector("#btnCancelar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("cancelar-orden", {
                detail: this._orden,
                bubbles: true,
                composed: true
            }));
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
    }
}

customElements.define("orden-proceso", OrdenProceso);
export default OrdenProceso;