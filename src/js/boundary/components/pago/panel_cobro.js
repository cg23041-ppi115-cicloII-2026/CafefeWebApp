import "./detalle_pedido_cobro.js";
import "./metodos_pago_split.js";
import "./resumen_abonos_pago.js";

class PanelCobro extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._orden = null;
        this._productos = [];
        this._abonos = [];
        this._procesando = false;
        this._listenersRegistrados = false;
    }

    set pedidoActual(valor) {
        this._orden = valor?.orden || null;
        this._productos = Array.isArray(valor?.productos) ? valor.productos : [];
        this._abonos = [];
        this._procesando = false;
        this._dibujar();
    }

    set procesando(valor) {
        this._procesando = Boolean(valor);
        this._dibujar();
    }

    connectedCallback() {
        if (!this._listenersRegistrados) {
            this._root.addEventListener("agregar-abono", (e) => {
                e.stopPropagation();
                this._agregarAbono(e.detail);
            });
            this._root.addEventListener("quitar-abono", (e) => {
                e.stopPropagation();
                this._abonos.splice(e.detail, 1);
                this._dibujar();
            });
            this._listenersRegistrados = true;
        }
        this._dibujar();
    }

    _calcularTotales() {
        const totalPedido = this._productos.reduce((acc, p) => acc + Number(p.precio || 0), 0);
        const totalPagado = this._abonos.reduce((acc, a) => acc + Number(a.monto || 0), 0);
        const saldoRestante = Math.max(0, Number((totalPedido - totalPagado).toFixed(2)));
        const vuelto = totalPagado > totalPedido ? Number((totalPagado - totalPedido).toFixed(2)) : 0;
        return { totalPedido, totalPagado, saldoRestante, vuelto };
    }

    _agregarAbono({ tipoPago, monto, referenciaExterna }) {
        const { saldoRestante } = this._calcularTotales();
        const montoNum = Number(Number(monto || 0).toFixed(2));
        if (saldoRestante <= 0 || Number.isNaN(montoNum) || montoNum <= 0) return;

        const montoAplicado = (tipoPago !== "EFECTIVO" && montoNum > saldoRestante)
            ? saldoRestante
            : montoNum;

        this._abonos.push({
            tipoPago,
            monto: montoAplicado,
            referenciaExterna: referenciaExterna || ""
        });
        this._dibujar();
    }

    _dibujar() {
        if (!this._orden) {
            this._root.innerHTML = `
                <link rel="stylesheet" href="./resources/estilos/components/panel_cobro.css">
                <div class="estado-vacio">
                    <h3>Terminal de Cobro (TPV)</h3>
                    <p>Selecciona una orden pendiente de la izquierda para iniciar el cobro.</p>
                </div>
            `;
            return;
        }

        const { totalPedido, totalPagado, saldoRestante, vuelto } = this._calcularTotales();
        const liquidado = saldoRestante === 0 && totalPedido > 0;

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/panel_cobro.css">
            <div class="tpv-card">
                <detalle-pedido-cobro id="subDetalle"></detalle-pedido-cobro>

                <div class="tpv-seccion">
                    <div class="seccion-titulo">
                        <span>Métodos Múltiples de Pago (Fraccionado)</span>
                        <span class="saldo-badge ${liquidado ? "saldo-cero" : "saldo-pendiente"}">
                            SALDO RESTANTE: $${saldoRestante.toFixed(2)}
                        </span>
                    </div>

                    <div class="grid-pagos">
                        <metodos-pago-split id="subMetodos"></metodos-pago-split>
                        <resumen-abonos-pago id="subResumen"></resumen-abonos-pago>
                    </div>
                </div>

                <div class="tpv-footer">
                    <button type="button" class="btn-limpiar" id="btnLimpiarPagos" ${this._abonos.length === 0 || this._procesando ? "disabled" : ""}>
                        Reiniciar Pagos
                    </button>
                    <button type="button" class="btn-finalizar" id="btnFinalizar" ${!liquidado || this._procesando ? "disabled" : ""}>
                        ${this._procesando ? "Registrando Factura..." : "FINALIZAR TRANSACCIÓN E IMPRIMIR RECIBO →"}
                    </button>
                </div>
            </div>
        `;

        const subDetalle = this._root.querySelector("#subDetalle");
        const subMetodos = this._root.querySelector("#subMetodos");
        const subResumen = this._root.querySelector("#subResumen");

        if (subDetalle?.configurar) {
            subDetalle.configurar({
                orden: this._orden,
                productos: this._productos,
                totalPedido,
                saldoRestante
            });
        }
        if (subMetodos) {
            subMetodos.saldoRestante = saldoRestante;
        }
        if (subResumen?.configurar) {
            subResumen.configurar({
                abonos: this._abonos,
                totalPagado,
                vuelto
            });
        }

        this._root.querySelector("#btnLimpiarPagos").addEventListener("click", () => {
            this._abonos = [];
            this._dibujar();
        });

        this._root.querySelector("#btnFinalizar").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("procesar-pago", {
                detail: {
                    orden: this._orden,
                    productos: this._productos,
                    abonos: [...this._abonos],
                    totalPedido,
                    totalPagado,
                    vuelto
                },
                bubbles: true,
                composed: true
            }));
        });
    }
}

customElements.define("panel-cobro", PanelCobro);
export default PanelCobro;