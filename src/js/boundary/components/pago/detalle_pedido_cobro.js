class DetallePedidoCobro extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._orden = null;
        this._productos = [];
        this._saldoRestante = 0;
        this._totalPedido = 0;
    }

    configurar({ orden, productos, totalPedido, saldoRestante }) {
        this._orden = orden;
        this._productos = productos || [];
        this._totalPedido = Number(totalPedido || 0);
        this._saldoRestante = Number(saldoRestante || 0);
        this._dibujar();
    }

    _dibujar() {
        if (!this._orden) return;
        const uidCorto = String(this._orden.idOrden || "0000").slice(-5).toUpperCase();
        const liquidado = this._saldoRestante <= 0 && this._totalPedido > 0;

        const itemsHTML = this._productos.map(prod => `
            <div class="fila-item">
                <span>1x ${prod.nombreProducto}</span>
                <strong>$${Number(prod.precio || 0).toFixed(2)}</strong>
            </div>
        `).join("");

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/panel_cobro.css">
            <div class="tpv-header">
                <div>
                    <span class="badge-directa">VISITA DIRECTA · CONSUMIDOR FINAL</span>
                    <h3>PEDIDO #${uidCorto}</h3>
                </div>
                <div class="total-caja">
                    <small>TOTAL PEDIDO</small>
                    <strong>$${this._totalPedido.toFixed(2)}</strong>
                </div>
            </div>

            <div class="tpv-seccion">
                <div class="seccion-titulo">
                    <span>Detalle de Productos</span>
                    <div class="atajos-rapidos">
                        <button type="button" class="btn-rapido" id="btnExactoEfectivo" ${liquidado ? "disabled" : ""}>
                            Pago Exacto Efectivo ($${this._saldoRestante.toFixed(2)})
                        </button>
                        <button type="button" class="btn-rapido btn-rapido-tarjeta" id="btnExactoTarjeta" ${liquidado ? "disabled" : ""}>
                            Pago Exacto Tarjeta ($${this._saldoRestante.toFixed(2)})
                        </button>
                    </div>
                </div>
                <div class="lista-items">${itemsHTML}</div>
            </div>
        `;

        this._root.querySelector("#btnExactoEfectivo").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("agregar-abono", {
                detail: { tipoPago: "EFECTIVO", monto: this._saldoRestante, referenciaExterna: "" },
                bubbles: true,
                composed: true
            }));
        });

        this._root.querySelector("#btnExactoTarjeta").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("agregar-abono", {
                detail: { tipoPago: "TARJETA", monto: this._saldoRestante, referenciaExterna: "" },
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("detalle-pedido-cobro", DetallePedidoCobro);
export default DetallePedidoCobro;