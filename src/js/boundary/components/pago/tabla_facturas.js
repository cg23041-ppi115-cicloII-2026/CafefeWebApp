class TablaFacturas extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._facturas = [];
        this._cargandoId = null;
        this._inicializado = false;
    }

    set datos({ facturas = [], cargandoId = null }) {
        this._facturas = Array.isArray(facturas) ? facturas : [];
        this._cargandoId = cargandoId;
        this._renderizarFilas();
    }

    connectedCallback() {
        if (!this._inicializado) {
            this._root.innerHTML = `
                <link rel="stylesheet" href="./resources/estilos/components/tabla_facturas.css">
                <div class="tabla-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>N° Factura</th>
                                <th>Fecha y Hora</th>
                                <th>Cliente</th>
                                <th>Referencia</th>
                                <th class="der">Comprobante</th>
                            </tr>
                        </thead>
                        <tbody id="cuerpoTabla"></tbody>
                    </table>
                </div>
            `;

            this._root.querySelector("#cuerpoTabla").addEventListener("click", (e) => {
                const btn = e.target.closest(".btn-ver-ticket");
                if (!btn) return;
                const factura = this._facturas.find(f => String(f.idFactura) === String(btn.dataset.id));
                if (!factura) return;

                this.dispatchEvent(new CustomEvent("seleccionar-factura", {
                    detail: factura,
                    bubbles: true,
                    composed: true
                }));
            });

            this._inicializado = true;
        }
        this._renderizarFilas();
    }

    _renderizarFilas() {
        if (!this._inicializado) return;
        const tbody = this._root.querySelector("#cuerpoTabla");
        tbody.innerHTML = "";

        if (this._facturas.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 5;
            td.className = "vacio";
            td.textContent = "No se encontraron facturas registradas.";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        const fragment = document.createDocumentFragment();
        this._facturas.forEach(f => {
            const cargando = String(this._cargandoId) === String(f.idFactura);
            const tr = document.createElement("tr");

            const tdNum = document.createElement("td");
            const strong = document.createElement("strong");
            strong.textContent = `#F-${f.numeroFormateado}`;
            tdNum.appendChild(strong);

            const tdFecha = document.createElement("td");
            tdFecha.textContent = f.fechaFormateada;

            const tdCliente = document.createElement("td");
            tdCliente.textContent = f.cliente || "Consumidor Final";

            const tdObs = document.createElement("td");
            tdObs.textContent = f.observaciones || "-";

            const tdAccion = document.createElement("td");
            tdAccion.className = "der";
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn-ver-ticket";
            btn.dataset.id = f.idFactura;
            btn.disabled = cargando;
            btn.textContent = cargando ? "Cargando..." : "Ver / Guardar PDF";
            tdAccion.appendChild(btn);

            tr.append(tdNum, tdFecha, tdCliente, tdObs, tdAccion);
            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);
    }
}

customElements.define("tabla-facturas", TablaFacturas);
export default TablaFacturas;