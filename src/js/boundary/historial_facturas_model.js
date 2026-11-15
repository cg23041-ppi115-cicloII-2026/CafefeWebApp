import FacturaDAO from "../control/factura_dao.js";
import FacturaOrdenProductoDAO from "../control/factura_orden_producto_dao.js";
import OrdenDAO from "../control/orden_dao.js";
import OrdenProductoDAO from "../control/orden_producto_dao.js";
import PagoDAO from "../control/pago_dao.js";
import PagoDetalleDAO from "../control/pago_detalle_dao.js";
import ProductoDAO from "../control/producto_dao.js";

class HistorialFacturasModel {
    constructor() {
        this._facturaDAO = new FacturaDAO();
        this._ordenDAO = new OrdenDAO();
        this._pagoDAO = new PagoDAO();
        this._productoDAO = new ProductoDAO();
        this._mapaProductos = new Map();
    }

    formatearFecha(fechaRaw) {
        if (!fechaRaw) return "Sin fecha";
        const limpia = String(fechaRaw).replace(/\[.*\]$/, "").trim();
        const fechaObj = new Date(limpia);
        if (Number.isNaN(fechaObj.getTime())) {
            return limpia;
        }
        return fechaObj.toLocaleString("es-SV");
    }

    async cargarMapaProductos() {
        try {
            const res = await this._productoDAO.findRange(0, 100);
            const lista = Array.isArray(res.datos) ? res.datos : [];
            this._mapaProductos.clear();
            lista.forEach(p => this._mapaProductos.set(String(p.idProducto), p.nombre));
        } catch {
            // Continuar con mapa vacío si falla
        }
    }

    async obtenerFacturasOrdenadas() {
        if (this._mapaProductos.size === 0) {
            await this.cargarMapaProductos();
        }

        const res = await this._facturaDAO.findRange(0, 50);
        const lista = Array.isArray(res.datos) ? res.datos : [];

        return lista
            .sort((a, b) => {
                const fa = new Date(String(a.fechaFacturacion || 0).replace(/\[.*\]$/, ""));
                const fb = new Date(String(b.fechaFacturacion || 0).replace(/\[.*\]$/, ""));
                return (fb.getTime() || 0) - (fa.getTime() || 0);
            })
            .map(f => ({
                ...f,
                numeroFormateado: String(f.idFactura || "00000").slice(-6).toUpperCase(),
                fechaFormateada: this.formatearFecha(f.fechaFacturacion)
            }));
    }

    async _obtenerProductosDeFactura(factura) {
        // Intento 1: Subrecurso /factura/{id}/ordenproducto
        try {
            const fopDAO = new FacturaOrdenProductoDAO(factura.idFactura);
            const resFop = await fopDAO.findRange(0, 50);
            const itemsFop = Array.isArray(resFop.datos) ? resFop.datos : [];

            if (itemsFop.length > 0 && typeof itemsFop[0].idOrdenProducto === "object" && itemsFop[0].idOrdenProducto?.precio !== undefined) {
                return itemsFop.map(rel => this._mapearProductoOrden(rel.idOrdenProducto));
            }
        } catch {
            // Continuar al respaldo
        }

        // Intento 2: Buscar la orden por el sufijo en observaciones ("Orden #XXXXX")
        try {
            const match = String(factura.observaciones || "").match(/#([A-Za-z0-9]+)/);
            if (match) {
                const sufijo = match[1].toUpperCase();
                const resOrdenes = await this._ordenDAO.findRange(0, 100);
                const ordenes = Array.isArray(resOrdenes.datos) ? resOrdenes.datos : [];
                const ordenEncontrada = ordenes.find(o =>
                    String(o.idOrden || "").toUpperCase().endsWith(sufijo)
                );

                if (ordenEncontrada) {
                    const opDAO = new OrdenProductoDAO(ordenEncontrada.idOrden);
                    const resOp = await opDAO.findRange(0, 50);
                    const itemsOp = Array.isArray(resOp.datos) ? resOp.datos : [];
                    return itemsOp.map(op => this._mapearProductoOrden(op));
                }
            }
        } catch {
            // Ignorar si no se encuentra
        }

        return [];
    }

    _mapearProductoOrden(op) {
        const idProd = typeof op.idProducto === "object" ? op.idProducto?.idProducto : op.idProducto;
        const nombre = (typeof op.idProducto === "object" && op.idProducto?.nombre)
            || this._mapaProductos.get(String(idProd))
            || `Producto #${String(idProd || "0000").slice(-5).toUpperCase()}`;
        return {
            nombreProducto: nombre,
            precio: Number(op.precio || 0)
        };
    }

    _extraerDatosClienteYOrden(factura) {
        const obs = String(factura.observaciones || "");
        const matchClienteObs = obs.match(/Cliente:\s*([^|]+)/i);
        const clienteNombre = (factura.cliente && factura.cliente.trim())
            || (matchClienteObs ? matchClienteObs[1].trim() : "Consumidor Final");

        const matchOrden = obs.match(/#([A-Za-z0-9]+)/);
        const idOrdenRef = matchOrden ? matchOrden[1].toUpperCase() : null;

        return {
            clienteNombre,
            orden: idOrdenRef
                ? { idOrden: idOrdenRef, clienteNombre }
                : { clienteNombre }
        };
    }

    async construirDetalleTicket(factura) {
        const productos = await this._obtenerProductosDeFactura(factura);
        const totalPedido = productos.reduce((acc, p) => acc + Number(p.precio || 0), 0);

        let abonos = [];
        try {
            const resPagos = await this._pagoDAO.findRange(0, 100);
            const pagos = Array.isArray(resPagos.datos) ? resPagos.datos : [];
            const pagoFactura = pagos.find(p => {
                const idF = typeof p.idFactura === "object" ? p.idFactura?.idFactura : p.idFactura;
                return String(idF) === String(factura.idFactura);
            });

            if (pagoFactura?.idPago) {
                const pdDAO = new PagoDetalleDAO(pagoFactura.idPago);
                const resDet = await pdDAO.findRange(0, 50);
                const detalles = Array.isArray(resDet.datos) ? resDet.datos : [];
                abonos = detalles.map(d => ({
                    tipoPago: d.tipoPago || "PAGO",
                    monto: Number(d.monto || 0),
                    referenciaExterna: d.referenciaExterna || ""
                }));
            }
        } catch {
            // Respaldo si no hay detalles
        }

        if (abonos.length === 0) {
            abonos = [{ tipoPago: "PAGADO", monto: totalPedido, referenciaExterna: "" }];
        }

        const totalPagado = abonos.reduce((acc, a) => acc + a.monto, 0);
        const vuelto = totalPagado > totalPedido ? Number((totalPagado - totalPedido).toFixed(2)) : 0;
        const { clienteNombre, orden } = this._extraerDatosClienteYOrden(factura);

        return {
            idFactura: factura.idFactura,
            cliente: clienteNombre,
            orden,
            productos: productos.length > 0
                ? productos
                : [{ nombreProducto: factura.observaciones || "Consumo Cafefe", precio: totalPedido }],
            abonos,
            totalPedido,
            totalPagado,
            vuelto,
            fecha: factura.fechaFormateada || this.formatearFecha(factura.fechaFacturacion)
        };
    }
}

export default HistorialFacturasModel;