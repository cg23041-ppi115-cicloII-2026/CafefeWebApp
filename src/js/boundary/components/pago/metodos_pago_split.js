class MetodosPagoSplit extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._saldoRestante = 0;
        this._liquidado = false;
    }

    set saldoRestante(valor) {
        this._saldoRestante = Number(valor || 0);
        this._liquidado = this._saldoRestante <= 0;
        this._dibujar();
    }

    connectedCallback() {
        this._dibujar();
    }

    _emitirAbono(tipoPago, inputSelector) {
        const raw = this._root.querySelector(inputSelector).value || this._saldoRestante;
        const monto = Number(Number(raw).toFixed(2));
        if (Number.isNaN(monto) || monto <= 0 || this._liquidado) return;

        const referenciaExterna = this._root.querySelector("#inputReferencia").value.trim();
        this.dispatchEvent(new CustomEvent("agregar-abono", {
            detail: { tipoPago, monto, referenciaExterna },
            bubbles: true,
            composed: true
        }));
    }

    _dibujar() {
        const disabledAttr = this._liquidado ? "disabled" : "";
        const placeholder = this._saldoRestante.toFixed(2);

        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/components/panel_cobro.css">
            <div class="columna-inputs">
                <div class="fila-metodo">
                    <label>Efectivo ($)</label>
                    <input type="number" step="0.01" min="0.01" id="inputEfectivo" placeholder="${placeholder}" ${disabledAttr}>
                    <button type="button" class="btn-aplicar" id="btnEfectivo" ${disabledAttr}>Aplicar</button>
                </div>

                <div class="fila-metodo">
                    <label>Tarjeta ($)</label>
                    <input type="number" step="0.01" min="0.01" max="${placeholder}" id="inputTarjeta" placeholder="${placeholder}" ${disabledAttr}>
                    <button type="button" class="btn-aplicar" id="btnTarjeta" ${disabledAttr}>Aplicar</button>
                </div>

                <div class="fila-metodo">
                    <label>Pago QR ($)</label>
                    <input type="number" step="0.01" min="0.01" max="${placeholder}" id="inputQr" placeholder="${placeholder}" ${disabledAttr}>
                    <button type="button" class="btn-aplicar" id="btnQr" ${disabledAttr}>Aplicar</button>
                </div>

                <input type="text" id="inputReferencia" class="input-referencia"
                    placeholder="N° autorización / referencia (opcional para Tarjeta o QR)" ${disabledAttr}>
            </div>
        `;

        this._root.querySelector("#btnEfectivo").addEventListener("click", () => this._emitirAbono("EFECTIVO", "#inputEfectivo"));
        this._root.querySelector("#btnTarjeta").addEventListener("click", () => this._emitirAbono("TARJETA", "#inputTarjeta"));
        this._root.querySelector("#btnQr").addEventListener("click", () => this._emitirAbono("QR", "#inputQr"));
    }
}

customElements.define("metodos-pago-split", MetodosPagoSplit);
export default MetodosPagoSplit;