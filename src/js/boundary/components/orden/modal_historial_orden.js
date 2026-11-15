import "../barra_busqueda.js";

class ModalHistorialOrden extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._items = [];
        this._filtro = "";
    }

    abrir(items = []) {
        this._items = items;
        this._filtro = "";
        this._dibujar();
    }

    cerrar() {
        this._items = [];
        this._filtro = "";
        this._root.innerHTML = "";
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

    _filtrarItems() {
        const q = this._filtro.trim().toLowerCase();
        if (!q) return this._items;

        return this._items.filter(it => {
            const uid = String(it.orden.idOrden || "").slice(-5).toLowerCase();
            const cliente = String(it.orden.clienteNombre || "").toLowerCase();
            const detalle = String(it.detalleEstado || "").toLowerCase();
            const estado = it.estado === "cancelado" ? "cancelada" : "entregada";
            return uid.includes(q) || cliente.includes(q) || detalle.includes(q) || estado.includes(q);
        });
    }

    _renderizarLista() {
        const contenedor = this._root.querySelector("#contenedorHistorial");
        if (!contenedor) return;
        contenedor.innerHTML = "";

        const filtrados = this._filtrarItems();
        if (filtrados.length === 0) {
            const vacio = document.createElement("p");
            vacio.className = "sin-historial";
            vacio.textContent = this._items.length === 0
                ? "No hay órdenes entregadas ni canceladas en el turno de hoy."
                : "No se encontraron órdenes que coincidan con la búsqueda.";
            contenedor.appendChild(vacio);
            return;
        }

        const fragment = document.createDocumentFragment();
        filtrados.forEach((it) => {
            const uidCorto = String(it.orden.idOrden || "0000").slice(-5).toUpperCase();
            const fechaObj = this._parsearFecha(it.orden.fechaCreacion || it.orden.fecha_creacion);
            const fechaStr = fechaObj
                ? fechaObj.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" })
                : "";
            const estadoTexto = it.estado === "cancelado" ? "Cancelada" : "Entregada";
            const cliente = it.orden.clienteNombre ? ` · ${it.orden.clienteNombre}` : "";

            const row = document.createElement("div");
            row.className = `item-historial ${it.estado}`;

            const info = document.createElement("div");
            info.className = "item-historial-info";

            const h4 = document.createElement("h4");
            h4.textContent = `Orden #${uidCorto}${cliente} · ${estadoTexto}${fechaStr ? ` (${fechaStr})` : ""}`;

            const p = document.createElement("p");
            p.textContent = it.detalleEstado || "Sin detalles";

            info.append(h4, p);

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn-reabrir";

            if (it.pagada) {
                btn.disabled = true;
                btn.textContent = "Ya Pagada ✓";
                btn.title = "Esta orden ya tiene una factura emitida y no puede reabrirse.";
            } else {
                btn.dataset.idOrden = it.orden.idOrden;
                btn.textContent = "Reabrir Pedido";
            }

            row.append(info, btn);
            fragment.appendChild(row);
        });

        contenedor.appendChild(fragment);
    }

    _dibujar() {
        const hoyTexto = new Date().toLocaleDateString("es-SV", {
            weekday: "long",
            day: "2-digit",
            month: "short",
            year: "numeric"
        });

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/modal_historial_orden.css">
            <div class="modal-overlay" id="overlayHistorial">
                <div class="modal-historial">
                    <div class="modal-historial-header">
                        <div>
                            <h3>Historial del Turno · ${hoyTexto}</h3>
                        </div>
                        <button type="button" class="btn-cerrar-historial" id="btnCerrarHistorial">✕</button>
                    </div>
                    <div style="margin-bottom: 0.85rem;">
                        <barra-busqueda id="buscadorTurno" placeholder="Buscar por # orden, cliente o estado..."></barra-busqueda>
                    </div>
                    <div class="lista-historial" id="contenedorHistorial"></div>
                </div>
            </div>
        `;

        this._renderizarLista();

        this._root.querySelector("#btnCerrarHistorial").addEventListener("click", () => this.cerrar());

        this._root.querySelector("#buscadorTurno").addEventListener("buscar", (e) => {
            this._filtro = e.detail;
            this._renderizarLista();
        });

        this._root.querySelector("#contenedorHistorial").addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-reabrir");
            if (!btn || btn.disabled) return;

            const item = this._items.find(it => String(it.orden.idOrden) === String(btn.dataset.idOrden));
            if (!item) return;

            this.cerrar();
            this.dispatchEvent(new CustomEvent("reabrir-orden", {
                detail: item,
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("modal-historial-orden", ModalHistorialOrden);
export default ModalHistorialOrden;