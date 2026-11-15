export class TestRunner {
    constructor(contenedorResultados) {
        this.contenedor = contenedorResultados;
        this.pasados = 0;
        this.fallados = 0;
    }

    assertTrue(condicion, mensaje = "Se esperaba verdadero") {
        if (!condicion) throw new Error(mensaje);
    }

    assertFalse(condicion, mensaje = "Se esperaba falso") {
        if (condicion) throw new Error(mensaje);
    }

    assertEqual(actual, esperado, mensaje = "") {
        if (actual !== esperado) {
            throw new Error(`${mensaje} | Esperado: "${esperado}", Recibido: "${actual}"`);
        }
    }

    assertContains(texto, subcadena, mensaje = "") {
        if (!String(texto || "").includes(subcadena)) {
            throw new Error(`${mensaje} | No se encontró "${subcadena}" en "${texto}"`);
        }
    }

    async suite(nombreSuite, fnPruebas) {
        const bloque = document.createElement("section");
        bloque.className = "suite";
        bloque.innerHTML = `<h2>${nombreSuite}</h2><ul></ul>`;
        const lista = bloque.querySelector("ul");
        this.contenedor.appendChild(bloque);

        await fnPruebas({
            test: async (nombreTest, fn) => {
                const li = document.createElement("li");
                try {
                    await fn(this);
                    this.pasados++;
                    li.className = "ok";
                    li.textContent = `✓ ${nombreTest}`;
                } catch (err) {
                    this.fallados++;
                    li.className = "fail";
                    li.innerHTML = `✕ ${nombreTest}<pre>${err.message}</pre>`;
                }
                lista.appendChild(li);
            }
        });
    }

    resumen() {
        const div = document.createElement("div");
        div.className = `resumen ${this.fallados === 0 ? "exito" : "error"}`;
        div.textContent = `Total: ${this.pasados + this.fallados} | Pasados: ${this.pasados} | Fallados: ${this.fallados}`;
        this.contenedor.prepend(div);
    }
}