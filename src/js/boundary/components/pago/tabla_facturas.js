class TablaFacturas extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._facturas = [];
        this._cargandoId = null;
    }

    set datos({ facturas = [], cargandoId = null }) {
        this._facturas = facturas;
        this._cargandoId = cargandoId;
        this._dibujar();
    }

    connectedCallback() {
        this._dibujar();
    }

    _dibujar() {
        const filasHTML = this._facturas.length === 0
            ? `<tr><td colspan="5" class="vacio">No se encontraron facturas registradas.</td></tr>`
            : this._facturas.map(f => {
                const cargando = String(this._cargandoId) === String(f.idFactura);
                return `
                    <tr>
                        <td><strong>#F-${f.numeroFormateado}</strong></td>
                        <td>${f.fechaFormateada}</td>
                        <td>${f.cliente || "Consumidor Final"}</td>
                        <td>${f.observaciones || "-"}</td>
                        <td class="der">
                            <button type="button" class="btn-ver-ticket" data-id="${f.idFactura}" ${cargando ? "disabled" : ""}>
                                ${cargando ? "Cargando..." : "Ver / Guardar PDF"}
                            </button>
                        </td>
                    </tr>
                `;
            }).join("");

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
                    <tbody>${filasHTML}</tbody>
                </table>
            </div>
        `;

        this._root.querySelectorAll(".btn-ver-ticket").forEach(btn => {
            btn.addEventListener("click", () => {
                const factura = this._facturas.find(f => String(f.idFactura) === String(btn.dataset.id));
                if (!factura) return;

                this.dispatchEvent(new CustomEvent("seleccionar-factura", {
                    detail: factura,
                    bubbles: true,
                    composed: true
                }));
            });
        });
    }
}

customElements.define("tabla-facturas", TablaFacturas);
export default TablaFacturas;