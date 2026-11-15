class ModalHistorialOrden extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._items = [];
    }

    abrir(items = []) {
        this._items = items;
        this._dibujar();
    }

    cerrar() {
        this._items = [];
        this._root.innerHTML = "";
    }

    _dibujar() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/modal_historial_orden.css">
            <div class="modal-overlay" id="overlayHistorial">
                <div class="modal-historial">
                    <div class="modal-historial-header">
                        <h3>Historial del Turno (Entregadas y Canceladas)</h3>
                        <button type="button" class="btn-cerrar-historial" id="btnCerrarHistorial">✕</button>
                    </div>
                    <div class="lista-historial" id="contenedorHistorial"></div>
                </div>
            </div>
        `;

        const contenedor = this._root.querySelector("#contenedorHistorial");

        if (!this._items.length) {
            const vacio = document.createElement("p");
            vacio.className = "sin-historial";
            vacio.textContent = "No hay órdenes entregadas ni canceladas en este turno.";
            contenedor.appendChild(vacio);
        } else {
            const fragment = document.createDocumentFragment();
            this._items.forEach((it, idx) => {
                const uidCorto = String(it.orden.idOrden || "0000").slice(-5).toUpperCase();
                const fechaStr = it.orden.fechaCreacion
                    ? new Date(it.orden.fechaCreacion).toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" })
                    : "";
                const estadoTexto = it.estado === "cancelado" ? "Cancelada" : "Entregada";

                const row = document.createElement("div");
                row.className = `item-historial ${it.estado}`;

                const info = document.createElement("div");
                info.className = "item-historial-info";

                const h4 = document.createElement("h4");
                h4.textContent = `Orden #${uidCorto} · ${estadoTexto}${fechaStr ? ` (${fechaStr})` : ""}`;

                const p = document.createElement("p");
                p.textContent = it.detalleEstado || "Sin detalles";

                info.append(h4, p);

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "btn-reabrir";
                btn.dataset.index = idx;
                btn.textContent = "Reabrir Pedido";

                row.append(info, btn);
                fragment.appendChild(row);
            });
            contenedor.appendChild(fragment);
        }

        this._root.querySelector("#btnCerrarHistorial").addEventListener("click", () => this.cerrar());

        contenedor.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-reabrir");
            if (!btn) return;
            const item = this._items[Number(btn.dataset.index)];
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