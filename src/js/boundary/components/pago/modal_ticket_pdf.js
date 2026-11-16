class ModalTicketPdf extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: "open" });
        this._datosTicket = null;
    }

    abrir(datos) {
        this._datosTicket = datos;
        this._dibujar();
    }

    cerrar() {
        this._datosTicket = null;
        this._root.innerHTML = "";
    }

    _dibujar() {
        if (!this._datosTicket) return;

        const {
            idFactura,
            cliente,
            cajero,
            orden,
            productos,
            abonos,
            totalPedido,
            totalPagado,
            vuelto,
            fecha
        } = this._datosTicket;

        const numFactura = String(idFactura || "00000").slice(-6).toUpperCase();
        const numOrden = orden?.idOrden
            ? `#${String(orden.idOrden).slice(-5).toUpperCase()}`
            : "Histórico";
        const nombreCliente = (
            cliente ||
            orden?.clienteNombre ||
            "Consumidor Final"
        ).trim();

        const filasProductos = productos.map(p => `
            <tr>
                <td>1x ${p.nombreProducto}</td>
                <td class="der">$${Number(p.precio || 0).toFixed(2)}</td>
            </tr>
        `).join("");

        const filasPagos = abonos.map(a => `
            <tr>
                <td>${a.tipoPago}${a.referenciaExterna ? ` (${a.referenciaExterna})` : ""}</td>
                <td class="der">$${Number(a.monto || 0).toFixed(2)}</td>
            </tr>
        `).join("");

        this._root.innerHTML = `
            <style>
                .overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(40, 25, 15, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1200;
                    font-family: 'Courier New', Courier, monospace;
                }
                .contenedor-modal {
                    background: #fff;
                    border-radius: 12px;
                    padding: 1.5rem;
                    max-width: 400px;
                    width: 92%;
                    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
                }
                .ticket-papel {
                    background: #fffdf9;
                    border: 1px dashed #8c735d;
                    padding: 1.25rem;
                    color: #222;
                    font-size: 0.88rem;
                    line-height: 1.4;
                }
                .centrado { text-align: center; }
                .der { text-align: right; }
                .ticket-papel h2 { margin: 0; font-size: 1.25rem; letter-spacing: 1px; }
                .linea { border-top: 1px dashed #666; margin: 0.65rem 0; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 3px 0; }
                .total-destacado { font-size: 1.05rem; font-weight: bold; }
                .acciones-ticket {
                    display: flex;
                    gap: 10px;
                    margin-top: 1.25rem;
                    font-family: var(--fuente-principal, system-ui, sans-serif);
                }
                button {
                    flex: 1;
                    padding: 0.7rem;
                    border-radius: 8px;
                    font-weight: 700;
                    cursor: pointer;
                    border: none;
                }
                .btn-imprimir {
                    background-color: var(--apple-red, #C8322B);
                    color: #fff;
                }
                .btn-cerrar {
                    background-color: var(--coffee-brown, #4B3621);
                    color: #fff;
                }
                @media print {
                    .acciones-ticket { display: none !important; }
                    .overlay { position: static; background: none; }
                    .contenedor-modal { box-shadow: none; padding: 0; max-width: 100%; }
                }
            </style>

            <div class="overlay">
                <div class="contenedor-modal">
                    <div class="ticket-papel" id="areaTicket">
                        <div class="centrado">
                            <h2>CAFEFE</h2>
                            <div>Especialidad en Café y Repostería</div>
                            <div>Santa Ana, El Salvador</div>
                        </div>
                        <div class="linea"></div>
                        <div><strong>Factura:</strong> #F-${numFactura}</div>
                        <div><strong>Orden:</strong> ${numOrden}</div>
                        <div><strong>Cliente:</strong> ${nombreCliente}</div>
                        <div><strong>Cajero:</strong> ${cajero || 'Caja Principal'}</div>
                        <div><strong>Fecha:</strong> ${fecha}</div>
                        <div class="linea"></div>
                        <table>
                            <tbody>${filasProductos}</tbody>
                        </table>
                        <div class="linea"></div>
                        <table>
                            <tbody>
                                <tr class="total-destacado">
                                    <td>TOTAL A PAGAR</td>
                                    <td class="der">$${Number(totalPedido || 0).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="linea"></div>
                        <div><strong>Detalle de Pago:</strong></div>
                        <table>
                            <tbody>${filasPagos}</tbody>
                        </table>
                        <div class="linea"></div>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Total Recibido:</td>
                                    <td class="der">$${Number(totalPagado || 0).toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td><strong>Vuelto:</strong></td>
                                    <td class="der"><strong>$${Number(vuelto || 0).toFixed(2)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="linea"></div>
                        <div class="centrado">¡Gracias por preferir Cafefe!</div>
                    </div>

                    <div class="acciones-ticket">
                        <button type="button" class="btn-imprimir" id="btnImprimirPdf">Guardar PDF / Imprimir</button>
                        <button type="button" class="btn-cerrar" id="btnCerrarTicket">Listo</button>
                    </div>
                </div>
            </div>
        `;

        this._root.querySelector("#btnImprimirPdf").addEventListener("click", () => {
            const tituloOriginal = document.title;
            document.title = `Factura-F-${numFactura}`;
            window.addEventListener("afterprint", () => {
                document.title = tituloOriginal;
            }, { once: true });
            window.print();
        });

        this._root.querySelector("#btnCerrarTicket").addEventListener("click", () => {
            this.cerrar();
        });
    }
}

customElements.define("modal-ticket-pdf", ModalTicketPdf);
export default ModalTicketPdf;