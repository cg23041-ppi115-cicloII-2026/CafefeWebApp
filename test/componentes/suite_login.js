import { TestRunner } from "../test_runner.js";

import "../../src/js/boundary/components/login/login_cafefe.js";

const sandbox = document.getElementById("sandbox");
const runner = new TestRunner(document.getElementById("resultados"));

function montar(tag, atributos = {}) {
    sandbox.innerHTML = "";
    const el = document.createElement(tag);
    Object.entries(atributos).forEach(([k, v]) => {
        if (v === true) el.setAttribute(k, "");
        else if (v !== false && v != null) el.setAttribute(k, v);
    });
    sandbox.appendChild(el);
    return el;
}

// 1. <login-cafefe>
await runner.suite("1. <login-cafefe>", async ({ test }) => {
    await test("Alterna visibilidad del UUID entre password y text al pulsar Mostrar/Ocultar", (t) => {
        const login = montar("login-cafefe");
        const shadow = login.root;

        const inputUuid = shadow.getElementById("inputUuidEmpleado");
        const btnToggle = shadow.getElementById("btnToggleUuid");

        t.assertEqual(inputUuid.type, "password");
        t.assertEqual(btnToggle.textContent.trim(), "Mostrar");

        btnToggle.click();
        t.assertEqual(inputUuid.type, "text");
        t.assertEqual(btnToggle.textContent.trim(), "Ocultar");

        btnToggle.click();
        t.assertEqual(inputUuid.type, "password");
        t.assertEqual(btnToggle.textContent.trim(), "Mostrar");
    });

    await test("Muestra y oculta alerta de error mediante el setter 'error' y deshabilita botón con 'cargando'", (t) => {
        const login = montar("login-cafefe");
        const shadow = login.root;

        const alerta = shadow.getElementById("alertaLogin");
        const btnSubmit = shadow.getElementById("btnSubmitLogin");

        t.assertTrue(alerta.classList.contains("oculto"));

        login.error = "UUID inválido";
        t.assertFalse(alerta.classList.contains("oculto"));
        t.assertEqual(alerta.textContent, "UUID inválido");

        login.error = "";
        t.assertTrue(alerta.classList.contains("oculto"));

        login.cargando = true;
        t.assertTrue(btnSubmit.disabled);
        t.assertEqual(btnSubmit.textContent.trim(), "Verificando...");

        login.cargando = false;
        t.assertFalse(btnSubmit.disabled);
        t.assertEqual(btnSubmit.textContent.trim(), "Iniciar Sesión");
    });

    await test("Emite 'intentar-login' con credenciales al enviar formulario y emite 'acceso-cliente'", (t) => {
        const login = montar("login-cafefe");
        const shadow = login.root;

        const inputNombre = shadow.getElementById("inputNombreEmpleado");
        const inputUuid = shadow.getElementById("inputUuidEmpleado");
        const chkRecordar = shadow.getElementById("chkRecordarSesion");

        let datosLogin = null;
        login.addEventListener("intentar-login", e => { datosLogin = e.detail; });

        inputNombre.value = "Ana García";
        inputUuid.value = "uuid-999";
        chkRecordar.checked = true;
        shadow.getElementById("formLoginCafefe").dispatchEvent(new Event("submit"));

        t.assertEqual(datosLogin.nombre, "Ana García");
        t.assertEqual(datosLogin.idEmpleado, "uuid-999");
        t.assertTrue(datosLogin.recordar);

        let cliente = false;
        login.addEventListener("acceso-cliente", () => { cliente = true; });
        shadow.getElementById("btnAccesoCliente").click();
        t.assertTrue(cliente, "Debe emitir 'acceso-cliente'");
    });
});

runner.resumen();