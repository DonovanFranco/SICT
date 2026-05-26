let citasGlobal = [];
let filtroActual = "todos";
let ultimaVersion = "";
let citasPeriodosCache = [];
function obtenerSemanaActual() { } // ✅ GLOBAL
let offsetSemana = 0;

document.addEventListener("DOMContentLoaded", () => {
    const nombreAdmin = localStorage.getItem("adminNombre");

    document.getElementById("buscarAlumno")
        .addEventListener("keyup", filtrarTexto);

    document.getElementById("mostrarFilas")
        .addEventListener("change", aplicarFiltros);


    if (!nombreAdmin) {
        window.location.href = "ingreso-admin.html";
        return;
    }

    document.getElementById("adminNombre").textContent = nombreAdmin;

    cargarCitas();

    document
        .getElementById("buscarAlumno")
        .addEventListener("keyup", filtrarCitas);

    // 🔥 AUTO REFRESH CADA 30s (BIEN UBICADO)
    setInterval(() => {
        console.log("🔄 Actualizando citas...");
        cargarCitas();
    }, 30000);

    const modal = document.getElementById("modalAgenda");

    if (modal) {
        modal.addEventListener("shown.bs.modal", () => {
            const btn = document.getElementById("btnDescargarAgenda");

            if (!btn) return;

            btn.onclick = () => {
                const fecha = document.getElementById("fechaAgenda").value;

                if (!fecha) {
                    alert("Selecciona una fecha");
                    return;
                }

                window.open(`php/generar_agenda.php?fecha=${fecha}`, "_blank");
            };
        });
    }
});

// 🔒 Cerrar sesión
function cerrarSesion() {
    localStorage.removeItem("adminNombre");
    window.location.href = "ingreso-admin.html";
}

// 📥 Cargar citas
async function cargarCitas() {
    try {
        const res = await fetch("php/obtener_citas.php");
        const citas = await res.json();

        // 🔥 generar "firma" de datos
        const nuevaVersion = JSON.stringify(citas);

        // 🔥 comparar
        if (nuevaVersion === ultimaVersion) {
            console.log("🟢 Sin cambios");
            return;
        }

        console.log("🟡 Cambios detectados, actualizando...");

        ultimaVersion = nuevaVersion;
        citasGlobal = citas;

        aplicarFiltros();

        mostrarNotificacion();
    } catch (error) {
        console.error("Error cargando citas:", error);
    }
}

// 📊 Mostrar citas
function mostrarCitas(citas) {
    const tabla = document.getElementById("tablaCitas");
    tabla.innerHTML = "";

    if (citas.length === 0) {
        tabla.innerHTML = `
        <tr>
            <td colspan="6" class="text-center">
                No se encontraron resultados
            </td>
        </tr>`;
        return;
    }

    let html = "";

    citas.forEach((c) => {
        let estado = (c.estado || "Pendiente").trim();

        let clase = "bg-warning";

        if (estado === "Aceptado") clase = "bg-success";
        else if (estado === "Rechazado") clase = "bg-danger";

        html += `
        <tr>
            <td>


<button class="btn btn-success btn-sm"
onclick="cambiarEstado(${c.id_cita}, 'Aceptado', '${c.estado}')"
title="Aceptar cita">
<i class="bi bi-check-lg"></i>
</button>

<button class="btn btn-danger btn-sm"
onclick="cambiarEstado(${c.id_cita}, 'Rechazado', '${c.estado}')"
title="Rechazar cita">
<i class="bi bi-x-lg"></i>
</button>

<button class="btn btn-secondary btn-sm"
onclick="cambiarEstado(${c.id_cita}, 'Pendiente', '${c.estado}')"
title="Regresar a pendiente">
<i class="bi bi-arrow-left"></i>
</button>

<button class="btn btn-primary btn-sm"
onclick="verDetalles('${c.no_control}')"
data-bs-toggle="tooltip"
title="Ver detalles">

<i class="bi bi-eye"></i>

</button>

<button class="btn btn-warning btn-sm btnObs"
data-id="${c.id_cita}"
data-obs="${c.observaciones || ''}"
title="Agregar observación">
<i class="bi bi-chat-left-text"></i>
</button>

</td>

            <td>${c.curp}</td>
            <td>${c.nombre}</td>
            <td>${c.no_control}</td>
            <td>${c.fecha} ${c.hora}</td>

            <td>
                <span class="badge ${clase}">
                    ${estado}
                </span>
            </td>
        </tr>`;
    });

    tabla.innerHTML = html;

    document.querySelectorAll(".btnObs").forEach(btn => {
        btn.addEventListener("click", () => {

            const id = btn.dataset.id;
            const obs = btn.dataset.obs;

            abrirObservacion(id, obs);
        });
    });

    const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
    );
    tooltipTriggerList.forEach((el) => new bootstrap.Tooltip(el));

}

async function cambiarEstado(id, nuevoEstado, estadoActual) {

    // 🔥 normalizar
    const actual = estadoActual.toLowerCase();
    const nuevo = nuevoEstado.toLowerCase();

    // 🚫 ya está en ese estado
    if (actual === nuevo) {
        mostrarAlerta(`La cita ya está en estado "${nuevoEstado}"`, "warning");
        return;
    }

    const mensajes = {
        "Aceptado": "¿Aceptar esta cita?",
        "Rechazado": "¿Rechazar esta cita?",
        "Pendiente": "¿Regresar a pendiente?"
    };

    const ok = await confirmarAccion(mensajes[nuevoEstado]);

    if (!ok) return;

    try {

        const res = await fetch("php/citas.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: id,
                estatus: nuevoEstado
            })
        });

        const r = await res.json();

        if (!r.ok) {
            mostrarAlerta("Error al actualizar", "danger");
            return;
        }

        mostrarAlerta(`Cita actualizada a ${nuevoEstado}`, "success");

        cargarCitas();

    } catch (error) {
        mostrarAlerta("Error del servidor", "danger");
    }
}

// 🔄 Cambiar filtro
function cambiarFiltro(filtro) {
    filtroActual = filtro;
    aplicarFiltros();
}

function aplicarFiltros() {

    let resultado = [...citasGlobal];

    // 🔹 FILTRO POR ESTADO
    if (filtroActual === "pendiente") {
        resultado = resultado.filter(c =>
            (c.estado || "").trim() === "Pendiente"
        );

    } else if (filtroActual === "aceptado") {
        resultado = resultado.filter(c =>
            (c.estado || "").trim() === "Aceptado"
        );

    } else if (filtroActual === "rechazado") {
        resultado = resultado.filter(c =>
            (c.estado || "").trim() === "Rechazado"
        );
    }

    // 🔹 FILTRO POR TEXTO (BUSCADOR)
    const texto = document
        .getElementById("buscarAlumno")
        .value
        .toLowerCase();

    if (texto) {
        resultado = resultado.filter(c =>
            c.nombre.toLowerCase().includes(texto) ||
            c.curp.toLowerCase().includes(texto) ||
            c.no_control.toLowerCase().includes(texto)
        );
    }

    // 🔹 LÍMITE DE FILAS
    const limite = parseInt(
        document.getElementById("mostrarFilas").value
    );

    resultado = resultado.slice(0, limite);

    // 🔹 MOSTRAR
    mostrarCitas(resultado);
}


// 🔍 Buscador
function filtrarCitas() {
    const texto = document.getElementById("buscarAlumno").value.toLowerCase();

    let resultado = citasGlobal;

    if (filtroActual === "pendiente") {
        resultado = resultado.filter(
            (c) => (c.estado || "").trim() === "Pendiente",
        );
    } else if (filtroActual === "aceptado") {
        resultado = resultado.filter((c) => (c.estado || "").trim() === "Aceptado");
    } else if (filtroActual === "rechazado") {
        resultado = resultado.filter(
            (c) => (c.estado || "").trim() === "Rechazado",
        );
    }

    resultado = resultado.filter((c) => {
        return (
            c.nombre.toLowerCase().includes(texto) ||
            c.curp.toLowerCase().includes(texto) ||
            c.no_control.toLowerCase().includes(texto)
        );
    });

    mostrarCitas(resultado);
}


function filtrarTexto() {

    const texto = document
        .getElementById("buscarAlumno")
        .value.toLowerCase();

    const filtradas = citasGlobal.filter(c => {
        return (
            c.nombre.toLowerCase().includes(texto) ||
            c.curp.toLowerCase().includes(texto) ||
            c.no_control.toLowerCase().includes(texto)
        );
    });

    mostrarCitas(filtradas);
}

function filtrarPorFecha() {

    const fecha = document.getElementById("filtroFecha").value;

    if (!fecha) {
        mostrarAlerta("Selecciona una fecha", "warning");
        return;
    }

    const filtradas = citasGlobal.filter(c => c.fecha === fecha);

    if (filtradas.length === 0) {
        mostrarAlerta("No hay citas en esa fecha", "info");
    }

    mostrarCitas(filtradas);
}

function limpiarFiltroFecha() {

    document.getElementById("filtroFecha").value = "";

    mostrarCitas(citasGlobal);
}

function mostrarNotificacion() {
    const alerta = document.createElement("div");
    alerta.className = "alert alert-info position-fixed top-0 end-0 m-3";
    alerta.style.zIndex = "9999";
    alerta.innerText = "Nuevas citas actualizadas";

    document.body.appendChild(alerta);

    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

function mostrarVista(vista) {

    const vistaCitas = document.getElementById("vistaCitas");
    const vistaPeriodos = document.getElementById("vistaPeriodos");
    const vistaCalendario = document.getElementById("vistaCalendario");

    // 🔴 OCULTAR TODO
    vistaCitas.style.display = "none";
    vistaPeriodos.style.display = "none";
    vistaCalendario.style.display = "none";

    // 🟢 MOSTRAR SEGÚN SELECCIÓN
    if (vista === "periodos") {
        vistaPeriodos.style.display = "block";
        cargarPeriodos();

    } else if (vista === "bloqueados") {
        vistaPeriodos.style.display = "block";
        cargarDiasBloqueados();

    } else if (vista === "agendas") {
        vistaPeriodos.style.display = "block";
        cargarAgendas();

    } else if (vista === "calendario") {
        vistaCalendario.style.display = "block";
        cargarCalendario();

    } else {
        vistaCitas.style.display = "block";
        aplicarFiltros();
    }
}

async function cargarPeriodos() {
    const contenedor = document.getElementById("vistaPeriodos");

    contenedor.innerHTML = `
        <h5>Periodos Programados</h5>

        <button class="btn btn-primary btn-sm mb-3" onclick="mostrarFormularioPeriodo()">
            + Nuevo Periodo
        </button>

        <div id="tablaPeriodos">Cargando...</div>
    `;

    try {
        const res = await fetch("php/obtener_periodos.php");
        const data = await res.json();

        citasPeriodosCache = data; // 🔥 guardar cache

        mostrarTablaPeriodos(data);
    } catch (error) {
        contenedor.innerHTML = "Error cargando periodos";
    }
}

function mostrarTablaPeriodos(periodos) {
    let html = `
    <table class="table table-bordered align-middle">
        <thead>
            <tr>
                <th class="text-center">ID</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th class="text-center">Estado</th>
                <th style="width: 250px;">Acción</th> 
            </tr>
        </thead>
        <tbody>
    `;

    periodos.forEach((p) => {
        let estado =
            p.activo == 1
                ? '<span class="badge bg-success">Activo</span>'
                : '<span class="badge bg-secondary">Inactivo</span>';

        // Usamos w-100 en los botones para que ambos intenten ocupar el mismo espacio
        // O definimos un contenedor flex con elementos de ancho igual
        let boton =
            p.activo == 1
                ? '<button class="btn btn-secondary btn-sm w-50" disabled>Activo</button>'
                : `<button class="btn btn-success btn-sm w-50" onclick="activarPeriodo(${p.id})">Activar <i class="bi bi-power"></i></button>`;

        let eliminarBtn = `
            <button class="btn btn-danger btn-sm w-50" onclick="eliminarPeriodo(${p.id})">
                Eliminar <i class="bi bi-trash"></i>
            </button>`;

        html += `
        <tr>
            <td class="text-center">${p.id}</td>
            <td>${p.fecha_inicio}</td>
            <td>${p.fecha_fin}</td>
            <td class="text-center">${estado}</td>
            <td>
                <div class="d-flex gap-2">
                    ${boton}
                    ${eliminarBtn}
                </div>
            </td>
        </tr>`;
    });

    html += `</tbody></table>`;

    document.getElementById("tablaPeriodos").innerHTML = html;
}

function mostrarFormularioPeriodo() {
    const contenedor = document.getElementById("vistaPeriodos");

    contenedor.innerHTML = `
        <h5>Nuevo Periodo</h5>

        <div class="mb-3">
            <label>Fecha Inicio</label>
            <input type="date" id="fechaInicio" class="form-control">
        </div>

        <div class="mb-3">
            <label>Fecha Fin</label>
            <input type="date" id="fechaFin" class="form-control">
        </div>

        <button class="btn btn-success" onclick="guardarPeriodo()">Guardar</button>
        <button class="btn btn-secondary" onclick="cargarPeriodos()">Cancelar</button>
    `;
}

async function guardarPeriodo() {
    const inicio = document.getElementById("fechaInicio").value;
    const fin = document.getElementById("fechaFin").value;

    if (!inicio || !fin) {
        alert("Completa los campos");
        return;
    }

    const hoy = new Date().toISOString().split("T")[0];

    // 🚫 fecha pasada
    if (inicio < hoy || fin < hoy) {
        alert("No puedes usar fechas pasadas");
        return;
    }

    // 🚫 fin menor a inicio
    if (fin < inicio) {
        alert("La fecha fin no puede ser menor a la inicial");
        return;
    }

    // 🚫 empalme local (opcional pero útil)
    const empalme = citasPeriodosCache.some((p) => {
        return !(fin < p.fecha_inicio || inicio > p.fecha_fin);
    });

    if (empalme) {
        alert("Las fechas se empalman con otro periodo");
        return;
    }

    try {
        const res = await fetch("php/insertar_periodo.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fecha_inicio: inicio,
                fecha_fin: fin,
            }),
        });

        const r = await res.json();

        if (!r.ok) {
            alert(r.mensaje);
            return;
        }

        alert("Periodo guardado");
        cargarPeriodos();
    } catch (error) {
        alert("Error al guardar");
    }
}

async function activarPeriodo(id) {
    if (!confirm("¿Activar este periodo?")) {
        return;
    }

    try {
        await fetch("php/activar_periodo.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: id }),
        });

        cargarPeriodos();
    } catch (error) {
        alert("Error al activar");
    }
}

async function eliminarPeriodo(id) {
    if (!confirm("¿Eliminar este periodo?")) {
        return;
    }

    try {
        await fetch("php/eliminar_periodo.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: id }),
        });

        cargarPeriodos();
    } catch (error) {
        alert("Error al eliminar");
    }
}

async function cargarDiasBloqueados() {
    const contenedor = document.getElementById("vistaPeriodos");

    contenedor.innerHTML = `
        <h5>Días Bloqueados</h5>

        <input type="date" id="fechaBloqueo" class="form-control mb-2">
        <input type="text" id="motivoBloqueo" class="form-control mb-2" placeholder="Motivo">

        <button class="btn btn-danger mb-3" onclick="agregarBloqueo()">
            Bloquear día
        </button>

        <div id="tablaBloqueos"></div>
    `;

    const res = await fetch("php/bloqueos.php");
    const data = await res.json();

    let html =
        "<table class='table'><tr><th>Fecha</th><th>Motivo</th><th></th></tr>";

    data.forEach((d) => {
        html += `
        <tr>
            <td>${d.fecha}</td>
            <td>${d.motivo}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="eliminarBloqueo(${d.id})">
                    X
                </button>
            </td>
        </tr>`;
    });

    html += "</table>";

    document.getElementById("tablaBloqueos").innerHTML = html;
}

async function agregarBloqueo() {
    const fecha = document.getElementById("fechaBloqueo").value;
    const motivo = document.getElementById("motivoBloqueo").value;

    // 🚫 campos vacíos
    if (!fecha || !motivo) {
        mostrarAlerta("Completa todos los campos", "warning");
        return;
    }

    const hoy = new Date().toISOString().split("T")[0];

    // 🚫 fecha pasada
    if (fecha < hoy) {
        mostrarAlerta("No puedes bloquear días pasados", "danger");
        return;
    }

    // ⚠️ confirmación
    const ok = await confirmarAccion("¿Seguro que deseas bloquear este día?");

    if (!ok) return;

    try {
        const res = await fetch("php/bloqueos.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fecha, motivo }),
        });

        const r = await res.json();

        if (!r.ok) {
            mostrarAlerta("Error al bloquear", "danger");
            return;
        }

        mostrarAlerta("Día bloqueado correctamente", "success");

        cargarDiasBloqueados();
    } catch (error) {
        mostrarAlerta("Error del servidor", "danger");
    }
}

async function eliminarBloqueo(id) {
    const ok = await confirmarAccion("¿Eliminar este día bloqueado?");

    if (!ok) return;

    await fetch("php/bloqueos.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
    });

    mostrarAlerta("Día eliminado", "info");

    cargarDiasBloqueados();
}

async function cargarAgendas() {
    const contenedor = document.getElementById("vistaPeriodos");

    try {
        // 🔥 traer periodos
        const periodos = await fetch("php/obtener_periodos.php").then((r) =>
            r.json(),
        );

        let select = "<select id='periodoSelect' class='form-select mb-2'>";

        periodos.forEach((p) => {
            select += `<option value="${p.id}">
                ${p.fecha_inicio} - ${p.fecha_fin}
            </option>`;
        });

        select += "</select>";

        contenedor.innerHTML = `
            <h5>Configurar Agendas</h5>

            ${select}

            <input type="time" id="horaInicio" class="form-control mb-2">
            <input type="time" id="horaFin" class="form-control mb-2">

            <button class="btn btn-success mb-3" onclick="agregarAgenda()">
                Agregar horario
            </button>

            <div id="tablaAgendas"></div>
        `;

        mostrarAgendas();
    } catch (error) {
        console.error("Error cargando agendas:", error);
    }
}

async function agregarAgenda() {
    const id_periodo = document.getElementById("periodoSelect").value;
    const inicio = document.getElementById("horaInicio").value;
    const fin = document.getElementById("horaFin").value;

    // 🚫 Validaciones
    if (!inicio || !fin) {
        mostrarAlerta("Debes ingresar ambas horas", "warning");
        return;
    }

    if (fin <= inicio) {
        mostrarAlerta("La hora fin debe ser mayor a la inicial", "danger");
        return;
    }

    // ⚠️ Confirmación bonita
    const ok = await confirmarAccion(`¿Agregar horario de ${inicio} a ${fin}?`);

    if (!ok) return;

    try {
        const res = await fetch("php/agendas.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_periodo, inicio, fin }),
        });

        const r = await res.json();

        if (!r.ok) {
            mostrarAlerta(r.error || "Error al guardar", "danger");
            return;
        }

        mostrarAlerta("Horario agregado correctamente", "success");

        // limpiar inputs (detalle UX)
        document.getElementById("horaInicio").value = "";
        document.getElementById("horaFin").value = "";

        mostrarAgendas();
    } catch (error) {
        mostrarAlerta("Error del servidor", "danger");
    }
}

async function mostrarAgendas() {
    try {
        const data = await fetch("php/agendas.php").then((r) => r.json());

        let html = `
        <table class='table'>
            <tr>
                <th>ID</th>
                <th>Periodo</th>
                <th>Horario</th>
                <th></th>
            </tr>
        `;

        data.forEach((a) => {
            html += `
            <tr>
                <td>${a.id}</td>
                <td>${a.fecha_inicio} - ${a.fecha_fin}</td>
                <td>${a.hora_inicio} - ${a.hora_fin}</td>
                <td>
                    <button class="btn btn-danger btn-sm"
                        onclick="eliminarAgenda(${a.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>`;
        });

        html += "</table>";

        document.getElementById("tablaAgendas").innerHTML = html;
    } catch (error) {
        console.error("Error mostrando agendas:", error);
    }
}

async function eliminarAgenda(id) {
    const ok = await confirmarAccion("¿Eliminar este horario?");

    if (!ok) return;

    try {
        await fetch("php/agendas.php", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        mostrarAlerta("Horario eliminado", "info");

        mostrarAgendas();
    } catch (error) {
        mostrarAlerta("Error al eliminar", "danger");
    }
}

function mostrarAlerta(mensaje, tipo = "success") {
    const alerta = document.createElement("div");

    alerta.className = `alert alert-${tipo} position-fixed top-0 end-0 m-3`;
    alerta.style.zIndex = "9999";
    alerta.innerText = mensaje;

    document.body.appendChild(alerta);

    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

function confirmarAccion(mensaje) {
    return new Promise((resolve) => {
        const modalHTML = `
        <div class="modal fade" id="modalConfirm" tabindex="-1">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-body text-center">
                <p>${mensaje}</p>
                <button class="btn btn-danger" id="btnConfirmar">Sí</button>
                <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              </div>
            </div>
          </div>
        </div>`;

        document.body.insertAdjacentHTML("beforeend", modalHTML);

        const modal = new bootstrap.Modal(document.getElementById("modalConfirm"));
        modal.show();

        document.getElementById("btnConfirmar").onclick = () => {
            resolve(true);
            modal.hide();
        };

        document
            .getElementById("modalConfirm")
            .addEventListener("hidden.bs.modal", () => {
                document.getElementById("modalConfirm").remove();
                resolve(false);
            });
    });
}

function abrirObservacion(id, textoActual) {

    const modalHTML = `
    <div class="modal fade" id="modalObs" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">

          <div class="modal-header">
            <h5 class="modal-title">Observaciones</h5>
            <button class="btn-close" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">
            <textarea id="txtObservacion" 
                class="form-control" 
                rows="4">${textoActual || ''}</textarea>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-success" onclick="guardarObservacion(${id})">
                Guardar
            </button>
          </div>

        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = new bootstrap.Modal(document.getElementById("modalObs"));
    modal.show();

    document.getElementById("modalObs").addEventListener("hidden.bs.modal", () => {
        document.getElementById("modalObs").remove();
    });
}

async function guardarObservacion(id) {

    const texto = document.getElementById("txtObservacion").value;

    if (texto.trim() === "") {
        mostrarAlerta("La observación no puede estar vacía", "warning");
        return;
    }

    try {

        const res = await fetch("php/citas.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: id,
                observaciones: texto
            })
        });

        const r = await res.json();

        if (!r.ok) {
            mostrarAlerta("Error al guardar", "danger");
            return;
        }

        mostrarAlerta("Observación guardada correctamente", "success");

        // cerrar modal
        document.querySelector("#modalObs .btn-close").click();

        cargarCitas();

    } catch (error) {
        mostrarAlerta("Error del servidor", "danger");
    }
}


function obtenerSemana(offset = 0) {

    const hoy = new Date();
    const dia = hoy.getDay();

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1) + (offset * 7));

    let semana = [];

    for (let i = 0; i < 5; i++) {
        let d = new Date(lunes);
        d.setDate(lunes.getDate() + i);

        semana.push(d.toISOString().split("T")[0]);
    }

    return semana;
}

function semanaAnterior() {
    offsetSemana--;
    cargarCalendario();
}

function semanaSiguiente() {
    offsetSemana++;
    cargarCalendario();
}

function renderCalendario(citas) {

    const contenedor = document.getElementById("vistaCalendario");

    const semana = obtenerSemana(offsetSemana);

    function generarHoras() {

        let horas = [];

        let inicio = 9;   // 9 AM
        let fin = 15;     // 3 PM

        for (let h = inicio; h <= fin; h++) {

            horas.push(`${String(h).padStart(2, '0')}:00:00`);

            if (h !== fin) { // evita 15:30
                horas.push(`${String(h).padStart(2, '0')}:30:00`);
            }
        }

        return horas;
    }

    const horas = generarHoras();

    let html = `
    <div class="d-flex justify-content-between mb-3">
        <button class="btn btn-outline-primary btn-sm" onclick="semanaAnterior()">←</button>
        <h5>Vista Semanal</h5>
        <button class="btn btn-outline-primary btn-sm" onclick="semanaSiguiente()">→</button>
    </div>

    <div class="table-responsive">
    <table class="table table-bordered text-center align-middle">

    <thead>
        <tr>
            <th>Hora</th>`;

    semana.forEach(f => {
        html += `<th>${f}</th>`;
    });

    html += `</tr></thead><tbody>`;

    horas.forEach(hora => {

        html += `<tr><td><strong>${hora.slice(0, 5)}</strong></td>`;

        semana.forEach(fecha => {

            const citasHora = citas.filter(c =>
                c.fecha === fecha &&
                c.hora.substring(0, 5) === hora.substring(0, 5)
            );

            if (citasHora.length > 0) {

                html += `<td>`;

                citasHora.forEach(cita => {

                    let color = "bg-warning";

                    if (cita.estado === "Aceptado") color = "bg-success text-white";
                    else if (cita.estado === "Rechazado") color = "bg-danger text-white";

                    html += `
        <div class="cita-card ${color} p-2 mb-1 rounded"
            data-nombre="${cita.nombre}"
            data-telefono="${cita.telefono || ''}"
            data-correo="${cita.correo || ''}"
            data-fecha="${cita.fecha}"
            data-hora="${cita.hora}"
            data-obs="${cita.observaciones || ''}">
            
            <small>${cita.hora.substring(0, 5)} - ${cita.nombre}</small>
        </div>`;
                });

                html += `</td>`;

            } else {
                html += `<td></td>`;
            }
        });

        html += `</tr>`;
    });

    html += `</tbody></table></div>`;

    contenedor.innerHTML = html;


    document.querySelectorAll(".cita-card").forEach(el => {
        el.addEventListener("click", () => {

            abrirDetalleCita({
                nombre: el.dataset.nombre,
                telefono: el.dataset.telefono,
                correo: el.dataset.correo,
                fecha: el.dataset.fecha,
                hora: el.dataset.hora,
                observaciones: el.dataset.obs
            });

        });
    });
}

function abrirDetalleCita(data) {

    const modalHTML = `
    <div class="modal fade" id="modalDetalle" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">

          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">Detalle de Cita</h5>
            <button class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body">

            <p><strong>Nombre:</strong> ${data.nombre}</p>
            <p><strong>Teléfono:</strong> ${data.telefono || 'No disponible'}</p>
            <p><strong>Correo:</strong> ${data.correo || 'No disponible'}</p>

            <hr>

            <p><strong>Fecha:</strong> ${data.fecha}</p>
            <p><strong>Hora:</strong> ${data.hora}</p>

            <hr>

            <p><strong>Observaciones:</strong></p>
            <div class="p-2 border rounded bg-light">
                ${data.observaciones || 'Sin observaciones'}
            </div>

          </div>

        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = new bootstrap.Modal(document.getElementById("modalDetalle"));
    modal.show();

    document.getElementById("modalDetalle").addEventListener("hidden.bs.modal", () => {
        document.getElementById("modalDetalle").remove();
    });
}

async function cargarCalendario() {

    const contenedor = document.getElementById("vistaCalendario");
    contenedor.innerHTML = "Cargando...";

    const citas = await fetch("php/obtener_citas.php")
        .then(r => r.json());

    renderCalendario(citas);
}


async function verDetalles(no_control){

    try{

        const res = await fetch(
            "php/obtener_historial_alumno.php",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify({
                    no_control:no_control
                })
            }
        );

        const historial = await res.json();
        

        if(historial.length === 0){
            mostrarAlerta("No hay información","warning");
            return;
        }

        // 📌 primera cita = actual
        const cita = historial[0];

        // 📜 restantes = historial
        cita.historial = historial.slice(1);

        // 🔥 aquí ya llamas tu modal actual
        abrirModalDetalles(cita);

    }catch(error){

        console.error(error);

        mostrarAlerta(
            "Error cargando historial",
            "danger"
        );
    }
}


function abrirModalDetalles(cita) {

    // 🎨 COLOR ESTATUS CITA (Adaptado a tu interfaz)
    let colorEstado = "warning text-dark"; // Amarillo para pendientes como en tu tabla
    let textoEstado = cita.estatus || "Pendiente";

    if (textoEstado === "Aceptado") {
        colorEstado = "success text-white";
    } else if (textoEstado === "Rechazado") {
        colorEstado = "danger text-white";
    }

    // 📂 ESTATUS DE CARPETA GENERADA (Con contraste de badges limpios)
    const carpetaGenerada = parseInt(cita.carpeta_generada) === 1;
    const badgeCarpeta = carpetaGenerada 
        ? `<span class="badge bg-success-subtle text-success border border-success px-2 py-1"><i class="bi bi-folder-check"></i> Generada</span>`
        : `<span class="badge bg-secondary-subtle text-secondary border border-secondary px-2 py-1"><i class="bi bi-folder-x"></i> Sin Generar</span>`;

    // 🎓 VALIDACIÓN DE TITULACIÓN INTEGRAL
    let opcionTitulacionHTML = cita.opcion_titulacion || 'No definida';
    if (cita.tipo_integral && cita.tipo_integral.trim() !== "") {
        opcionTitulacionHTML += ` <span class="badge bg-primary-subtle text-primary border border-primary ms-1" title="Tipo Integral">${cita.tipo_integral}</span>`;
    }

    // 📜 Historial de citas anteriores
    let historialHTML = "";
    if (cita.historial && cita.historial.length > 0) {
        cita.historial.forEach(h => {
            let hEstadoClase = "bg-warning-subtle text-warning- Streets";
            if(h.estatus === 'Aceptado') hEstadoClase = "bg-success-subtle text-success border border-success";
            else if(h.estatus === 'Rechazado') hEstadoClase = "bg-danger-subtle text-danger border border-danger";
            else hEstadoClase = "bg-warning-subtle text-dark border border-warning";

            historialHTML += `
                <li class="list-group-item small d-flex justify-content-between align-items-center bg-white">
                    <span><i class="bi bi-calendar3 me-2 text-muted"></i> <strong>${h.fecha}</strong> a las ${h.hora.substring(0,5)}</span>
                    <span class="badge ${hEstadoClase}">${h.estatus}</span>
                </li>`;
        });
    } else {
        historialHTML = `<li class="list-group-item text-muted small bg-white text-center py-3">No se registran citas anteriores para este alumno.</li>`;
    }

    // 🏗️ ESTRUCTURA DEL MODAL CON ALTO CONTRASTE Y DISEÑO SEMENTADO
    const modalHTML = `
    <div class="modal fade" id="modalDetallesAlumno" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg" style="border-radius: 12px; overflow: hidden;">

          <div class="modal-header text-white" style="background-color: #0f2537; padding: 1.2rem 1.5rem;">
            <h5 class="modal-title d-flex align-items-center gap-2 m-0" style="font-weight: 500;">
                <i class="bi bi-person-badge-fill text-info"></i> Expediente Completo del Alumno
            </h5>
            <button class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body p-4" style="background-color: #f8f9fa;">
            
            <div class="card border-0 shadow-sm mb-4" style="border-radius: 8px;">
                <div class="card-body p-3 bg-white" style="border-radius: 8px;">
                    <div class="row g-3">
                        <div class="col-md-6 border-end-md">
                            <h6 class="text-uppercase text-muted small fw-bold mb-2">Datos Personales</h6>
                            <p class="mb-1"><strong>Nombre:</strong> <span class="text-secondary">${cita.nombre}</span></p>
                            <p class="mb-1"><strong>No. Control:</strong> <span class="text-secondary">${cita.no_control}</span></p>
                            <p class="mb-1"><strong>CURP:</strong> <span class="text-secondary">${cita.curp || 'No disponible'}</span></p>
                            <p class="mb-0"><strong>Carrera:</strong> <span class="text-secondary">${cita.carrera || 'No disponible'}</span></p>
                        </div>
                        <div class="col-md-6 ps-md-4">
                            <h6 class="text-uppercase text-muted small fw-bold mb-2">Detalles del Trámite</h6>
                            <p class="mb-1"><strong>Fecha Cita:</strong> <span class="text-secondary">${cita.fecha} — ${cita.hora.substring(0,5)} hs</span></p>
                            <p class="mb-1"><strong>Opción:</strong> ${opcionTitulacionHTML}</p>
                            <p class="mb-1"><strong>Estado Cita:</strong> <span class="badge bg-${colorEstado} px-2 py-1">${textoEstado}</span></p>
                            <p class="mb-0"><strong>Carpeta Digital:</strong> ${badgeCarpeta}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label fw-bold text-dark mb-1"><i class="bi bi-journal-text text-primary"></i> Notas Generales del Alumno (Perfil):</label>
                <div class="p-3 border border-primary-subtle rounded-3 bg-white shadow-sm text-dark" 
                     style="min-height: 60px; white-space: pre-wrap; border-left: 4px solid #0d6efd !important;">
                     ${cita.notas ? cita.notas : '<em class="text-muted small">Sin anotaciones previas en el expediente de este alumno.</em>'}
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label fw-bold text-dark mb-1"><i class="bi bi-chat-right-text-fill text-secondary"></i> Observaciones Específicas de esta Cita:</label>
                <div class="p-3 border border-gray rounded-3 bg-white shadow-sm text-dark" 
                     style="min-height: 60px; white-space: pre-wrap; border-left: 4px solid #6c757d !important;">
                     ${cita.observaciones ? cita.observaciones : '<em class="text-muted small">No se han capturado observaciones para esta fecha.</em>'}
                </div>
            </div>

            <div class="mb-2">
                <label class="form-label fw-bold text-dark mb-2"><i class="bi bi-clock-history text-info"></i> Línea de Tiempo / Historial de Citas:</label>
                <ul class="list-group shadow-sm" style="border-radius: 8px; overflow:hidden;">
                    ${historialHTML}
                </ul>
            </div>

          </div>

          <div class="modal-footer border-top bg-white p-3">
            <button class="btn btn-outline-secondary btn-sm px-4" data-bs-dismiss="modal" style="border-radius: 6px;">Cerrar Expediente</button>
          </div>

        </div>
      </div>
    </div>`;

    // Inyectar en el DOM limpio
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    const modal = new bootstrap.Modal(document.getElementById("modalDetallesAlumno"));
    modal.show();

    // Eliminar del DOM al cerrarse para prevenir colisiones de ID
    document.getElementById("modalDetallesAlumno").addEventListener("hidden.bs.modal", () => {
        document.getElementById("modalDetallesAlumno").remove();
    });
}