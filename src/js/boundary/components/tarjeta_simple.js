class TarjetaSimple extends HTMLElement {
    constructor() {
        super();
        // Crea el Shadow DOM encapsulado para aislar la estructura y los estilos
        this.root = this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        // 1. Sección del Título (Header)
        let titulo = document.createElement("div");
        titulo.setAttribute("class", "header");
        let slotTitulo = document.createElement("slot");
        slotTitulo.setAttribute("name", "titulo");
        slotTitulo.innerText = "Agregue un título";
        titulo.appendChild(slotTitulo);

        // 2. Sección del Contenido (Body)
        let contenido = document.createElement("div");
        contenido.setAttribute("class", "body");
        let slotContenido = document.createElement("slot");
        slotContenido.setAttribute("name", "contenido");
        slotContenido.innerText = "Agregue un contenido";
        contenido.appendChild(slotContenido);

        // 3. Sección del Pie (Footer)
        let pie = document.createElement("div");
        pie.setAttribute("class", "footer");
        let slotPie = document.createElement("slot");
        slotPie.setAttribute("name", "pie");
        slotPie.innerText = "Agregue un pie";
        pie.appendChild(slotPie);

        // 4. Hoja de estilos encapsulada dentro del Shadow DOM
        let estilo = document.createElement("link");
        estilo.setAttribute("rel", "stylesheet");
        estilo.setAttribute("href", "./resources/estilos/tarjeta.css");

        // 5. Montaje de todos los elementos en la raíz del componente
        this.root.appendChild(estilo);
        this.root.appendChild(titulo);
        this.root.appendChild(contenido);
        this.root.appendChild(pie);
    }
}

//FALTA DIBUJAR

// Registro de la etiqueta HTML personalizada
customElements.define("tarjeta-simple", TarjetaSimple);

export default TarjetaSimple;