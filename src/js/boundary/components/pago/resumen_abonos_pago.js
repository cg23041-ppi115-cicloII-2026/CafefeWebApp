class ResumenAbonosPago extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._abonos = [];
        this._totalPagado = 0;
        this._vuelto = 0;
        this._inicializado = false;
    }

    configurar({ abonos = [], totalPagado = 0, vuelto = 0 }) {
        this._abonos = abonos;
        this._totalPagado = Number(totalPagado || 0);
        this._vuelto = Number(vuelto || 0);
        this._renderizar();
    }

    connectedCallback() {
        if (!this._inicializado) {
            this._root.innerHTML = `
                <link rel="stylesheet" href="./resources/estilos/components/panel_cobro.css">
                <div class="columna-resumen">
                    <div class="resumen-titulo">Abonos Aplicados</div>
                    <div class="lista-abonos" id="listaAbonos"></div>
                    <div class="resumen-totales">
                        <div><span>Total Recibido:</span> <strong id="txtRecibido">$0.00</strong></div>
                        <div><span>Vuelto a Entregar:</span> <strong id="txtVuelto">$0.00</strong></div>
                    </div>
                </div>
            `;

            this._root.querySelector("#listaAbonos").addEventListener("click", (e) => {
                const btn = e.target.closest(".btn-quitar-abono");
                if (!btn) return;
                this.dispatchEvent(new CustomEvent("quitar-abono", {
                    detail: Number(btn.dataset.index),
                    bubbles: true,
                    composed: true
                }));
            });

            this._inicializado = true;
        }
        this._renderizar();
    }

    _renderizar() {
        if (!this._inicializado) return;
        const lista = this._root.querySelector("#listaAbonos");
        lista.innerHTML = "";

        if (this._abonos.length === 0) {
            const p = document.createElement("p");
            p.className = "texto-vacio-mini";
            p.textContent = "Aún no se han aplicado abonos.";
            lista.appendChild(p);
        } else {
            const fragment = document.createDocumentFragment();
            this._abonos.forEach((ab, idx) => {
                const fila = document.createElement("div");
                fila.className = "fila-abono";

                const info = document.createElement("span");
                info.textContent = ab.referenciaExterna
                    ? `${ab.tipoPago} (${ab.referenciaExterna})`
                    : ab.tipoPago;

                const derecha = document.createElement("div");
                derecha.className = "abono-derecha";

                const monto = document.createElement("strong");
                monto.textContent = `$${Number(ab.monto || 0).toFixed(2)}`;

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "btn-quitar-abono";
                btn.dataset.index = idx;
                btn.title = "Eliminar abono";
                btn.textContent = "✕";

                derecha.append(monto, btn);
                fila.append(info, derecha);
                fragment.appendChild(fila);
            });
            lista.appendChild(fragment);
        }

        this._root.querySelector("#txtRecibido").textContent = `$${this._totalPagado.toFixed(2)}`;
        this._root.querySelector("#txtVuelto").textContent = `$${this._vuelto.toFixed(2)}`;
    }
}

customElements.define("resumen-abonos-pago", ResumenAbonosPago);
export default ResumenAbonosPago;