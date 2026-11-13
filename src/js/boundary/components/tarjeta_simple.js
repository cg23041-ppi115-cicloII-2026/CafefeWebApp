class TarjetaSimple extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this._dibujar();
    }

    _dibujar() {
        this._root.innerHTML = `
            <link rel="stylesheet" href="./resources/estilos/tarjeta.css">
            <div class="header">
                <slot name="titulo">Agregue un título</slot>
            </div>
            <div class="body">
                <slot name="contenido">Agregue un contenido</slot>
            </div>
            <div class="footer">
                <slot name="pie">Agregue un pie</slot>
            </div>
        `;
    }
}

customElements.define('tarjeta-simple', TarjetaSimple);
export default TarjetaSimple;