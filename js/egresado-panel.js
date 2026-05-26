document.addEventListener("DOMContentLoaded", () => {

    const no_control = localStorage.getItem("alumno");

    if (!no_control) {
        window.location.href = "login.html";
        return;
    }

    mostrarVista("datos");
});


// 🔄 VISTAS
function mostrarVista(vista) {

    document.getElementById("vistaDatos").style.display = "none";
    document.getElementById("vistaCitas").style.display = "none";
    document.getElementById("vistaCarpeta").style.display = "none";

    if (vista === "datos") {

        document.getElementById("vistaDatos").style.display = "block";
        cargarDatos();

    } else if (vista === "citas") {

        document.getElementById("vistaCitas").style.display = "block";
        cargarCitas();

    } else if (vista === "carpeta") {

        document.getElementById("vistaCarpeta").style.display = "block";
        cargarCarpeta();
    }
}


// 🔒 SESIÓN
function cerrarSesion() {

    localStorage.removeItem("alumno");
    window.location.href = "ingreso-estudiante.html";
}


// =============================
// 👤 DATOS
// =============================

let datosOriginales = {};

const carreras = [

    "Licenciatura en Administración",
    "Arquitectura",
    "Ingeniería Civil",
    "Ingeniería en Diseño Industrial",
    "Ingeniería Eléctrica",
    "Ingeniería Ferroviaria",
    "Ingeniería en Gestión Empresarial",
    "Ingeniería Industrial",
    "Ingeniería Mecánica",
    "Ingeniería Química",
    "Ingeniería en Sistemas Computacionales",
    "Ingeniería en Tecnologías de la Información"
];

async function cargarDatos() {

    const contenedor = document.getElementById("vistaDatos");
    const no_control = localStorage.getItem("alumno");

    contenedor.innerHTML = "Cargando...";

    const res = await fetch(`/SICT/php/obtener_alumno.php?t=${Date.now()}`, {

        method: "POST",

        cache: "no-store",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({ no_control })
    });

    const data = await res.json();

    if (!data) {

        contenedor.innerHTML = "Error";
        return;
    }

    document.getElementById("nombreUsuario").textContent = data.nombre;

    datosOriginales = { ...data };

    renderDatos(data, false);
}


// 🔥 RENDER DATOS
function renderDatos(data, editable) {

    let html = `
    <h5 class="mb-4">
        Datos Personales
    </h5>

    <div class="row">
    `;

    for (let key in data) {

        if (
            key === "codigo_acceso" ||
            key === "fecha_registro" ||
            key === "notas"
        ) continue;

        const editableCampo = [
            "nombre",
            "curp",
            "carrera",
            "correo",
            "telefono"
        ].includes(key);

        if (key === "carrera") {

            html += `
            <div class="col-md-4 mb-3">

                <label class="form-label">
                    Carrera
                </label>

                <select
                    class="form-select form-select-sm"
                    id="carrera"
                    ${editable ? "" : "disabled"}>

                    <option value="">
                        Seleccione...
                    </option>

                    ${carreras.map(c => `
                        <option
                            ${data.carrera === c ? "selected" : ""}>
                            ${c}
                        </option>
                    `).join("")}

                </select>

            </div>`;

        } else {

            html += `
            <div class="col-md-4 mb-3">

                <label class="form-label">
                    ${formatearLabel(key)}
                </label>

                <input
                    type="text"
                    class="form-control form-control-sm"
                    id="${key}"
                    value="${data[key] ?? ''}"
                    ${editable && editableCampo ? "" : "disabled"}>

            </div>`;
        }
    }

    html += `
    </div>

    <div class="text-center mt-4">
    `;

    if (!editable) {

        html += `
        <button
            class="btn btn-primary px-4"
            onclick="habilitarEdicion()">

            Editar

        </button>`;

    } else {

        html += `
        <button
            class="btn btn-success px-4 me-2"
            onclick="guardarDatos()">

            Guardar

        </button>

        <button
            class="btn btn-danger px-4"
            onclick="cancelarEdicion()">

            Cancelar

        </button>`;
    }

    html += `</div>`;

    document.getElementById("vistaDatos").innerHTML = html;
}


// ✏️ EDITAR
function habilitarEdicion() {
    renderDatos(datosOriginales, true);
}


// ❌ CANCELAR
function cancelarEdicion() {

    Swal.fire({

        title: '¿Cancelar?',
        text: 'Se perderán los cambios',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545'

    }).then(r => {

        if (r.isConfirmed) {
            renderDatos(datosOriginales, false);
        }
    });
}


// 💾 GUARDAR
async function guardarDatos() {

    const confirm = await Swal.fire({

        title: '¿Guardar cambios?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#198754'
    });

    if (!confirm.isConfirmed) return;

    const inputs = document.querySelectorAll(
        "#vistaDatos input, #vistaDatos select"
    );

    let datos = {};

    inputs.forEach(i => {
        datos[i.id] = i.value;
    });

    const res = await fetch("/SICT/php/actualizar_alumno.php", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(datos)
    });

    const r = await res.json();

    if (r.ok) {

        Swal.fire({
            icon: 'success',
            title: 'Guardado',
            timer: 1500,
            showConfirmButton: false
        });

        cargarDatos();

    } else {

        Swal.fire(
            'Error',
            'No se pudo guardar',
            'error'
        );
    }
}


// 🔤 LABEL
function formatearLabel(t) {

    return t
        .replace(/_/g, " ")
        .replace(/\b\w/g, l => l.toUpperCase());
}


// =============================
// 📅 CITAS
// =============================

async function cargarCitas() {

    const contenedor = document.getElementById("vistaCitas");
    const no_control = localStorage.getItem("alumno");

    contenedor.innerHTML = "Cargando...";

    const res = await fetch(`/SICT/php/obtener_citas_alumno.php?t=${Date.now()}`, {

        method: "POST",

        cache: "no-store",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({ no_control })
    });

    const citas = await res.json();

    if (citas.length === 0) {

        contenedor.innerHTML = `
            <h5>Citas Agendadas</h5>

            <div class="alert alert-info">
                No tienes citas registradas
            </div>

            <button
                class="btn btn-success"
                onclick="irAgendar()">

                Agendar cita

            </button>
        `;

        return;
    }

    let hoy = new Date();
    hoy.setHours(0,0,0,0);

    let citaActual = null;
    let historial = [];

    citas.forEach(c => {

        const fechaCita = new Date(c.fecha + "T00:00:00");

        if (
            !citaActual &&
            fechaCita >= hoy &&
            (
                c.estatus === "Pendiente" ||
                c.estatus === "Aceptado"
            )
        ) {

            citaActual = c;

        } else {

            historial.push(c);
        }
    });

    let html = `
    <h5 class="mb-4">
        Citas Agendadas
    </h5>
    `;

    // 📌 ACTUAL
    if (citaActual) {

        html += `
        <div class="card border-primary mb-4">

            <div class="card-header bg-primary text-white">
                Próxima cita
            </div>

            <div class="card-body">

                <p>
                    <strong>Fecha:</strong>
                    ${citaActual.fecha}
                </p>

                <p>
                    <strong>Hora:</strong>
                    ${citaActual.hora}
                </p>

                <p>
                    <strong>Estado:</strong>
                    ${citaActual.estatus}
                </p>

                <p>
                    <strong>Observaciones:</strong>
                    ${citaActual.observaciones || 'Ninguna'}
                </p>

                <p>
                    <strong>Carpeta:</strong>

                    ${
                        citaActual.carpeta_generada == 1
                        ?
                        '<span class="badge bg-success">Generada</span>'
                        :
                        '<span class="badge bg-warning text-dark">Pendiente</span>'
                    }
                </p>

            </div>

        </div>`;
    }

    // 🔁 REAGENDAR
    let puedeReagendar = false;

    if (!citaActual) {
        puedeReagendar = true;
    }

    if (puedeReagendar) {

        html += `
        <div class="mb-4 text-center">

            <button
                class="btn btn-success"
                onclick="irAgendar()">

                Agendar nueva cita

            </button>

        </div>`;
    }

    // 📜 HISTORIAL
    html += `
    <h6>Historial</h6>

    <div class="table-responsive">

    <table class="table table-bordered table-sm">

        <thead class="table-light">

            <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Observaciones</th>
            </tr>

        </thead>

        <tbody>
    `;

    historial.forEach(c => {

        html += `
        <tr>

            <td>${c.fecha}</td>
            <td>${c.hora}</td>
            <td>${c.estatus}</td>
            <td>${c.observaciones || ''}</td>

        </tr>`;
    });

    html += `
        </tbody>
    </table>

    </div>
    `;

    contenedor.innerHTML = html;
}


// 📅 AGENDAR
function irAgendar() {

    localStorage.setItem("modoCita", "reagendar");

    window.location.href = "estudiantes-fecha.html";
}


// =============================
// 📁 GENERAR CARPETA
// =============================

const documentosPDF = [

    { id:"S_ACTO", nombre:"Solicitud del Acto de Recepción" },
    { id:"O_LIB", nombre:"Oficio de Liberación" },
    { id:"CURP", nombre:"CURP" },
    { id:"ACT_NAC", nombre:"Acta de Nacimiento" },
    { id:"CERT_BAC", nombre:"Certificado Bachillerato" },
    { id:"CED_BACH", nombre:"Cédula Bachillerato" },
    { id:"CERT_LIC_SS", nombre:"Certificado Licenciatura y Servicio Social" },
    { id:"FOR", nombre:"Equivalencia/Revalidación" },
    { id:"C_INGLES", nombre:"Constancia Inglés" },
    { id:"C_LIBRO", nombre:"Constancia Libro" },
    { id:"O_EI", nombre:"Oficio entrega informe" },
    { id:"R_BANCO", nombre:"Referencia bancaria" },
    { id:"P_RECEPCIONAL", nombre:"Voucher Recepcional" }
];

let archivosPDF = {};


// 📁 VISTA
function cargarCarpeta(){

    const contenedor = document.getElementById("vistaCarpeta");

    let html = `
    <h5 class="mb-4">
        Generar Carpeta
    </h5>

    <div class="alert alert-info">
        Todos los documentos deben ser PDF y pesar menos de 190 KB.
    </div>

    <div class="table-responsive">

    <table class="table table-bordered align-middle">

        <thead class="table-light">

            <tr>
                <th>#</th>
                <th>Documento</th>
                <th>Nombre PDF</th>
                <th>Archivo</th>
                <th>Estado</th>
            </tr>

        </thead>

        <tbody>
    `;

    documentosPDF.forEach((doc,index)=>{

        html += `
        <tr>

            <td>${index+1}</td>

            <td>${doc.nombre}</td>

            <td>
                <span class="badge bg-secondary">
                    ${doc.id}.pdf
                </span>
            </td>

            <td>

                <input
                    type="file"
                    accept=".pdf"
                    class="form-control form-control-sm"
                    onchange="validarPDF(event,'${doc.id}')">

            </td>

            <td id="estado_${doc.id}">

                <span class="badge bg-danger">
                    Pendiente
                </span>

            </td>

        </tr>`;
    });

    html += `
        </tbody>

    </table>

    </div>

    <div class="text-center mt-4">

        <button
            class="btn btn-success btn-lg"
            id="btnGenerarCarpeta"
            style="display:none;"
            onclick="generarCarpeta()">

            Generar Carpeta

        </button>

    </div>
    `;

    contenedor.innerHTML = html;
}


// ✅ VALIDAR PDF
function validarPDF(event, nombre){

    const archivo = event.target.files[0];

    if(!archivo) return;

    // 🔴 VALIDAR PDF
    if(archivo.type !== "application/pdf"){

        Swal.fire({
            icon:'error',
            title:'Archivo inválido',
            text:'Solo se permiten archivos PDF'
        });

        event.target.value = "";
        return;
    }

    // 🔴 VALIDAR PESO
    const pesoMaximo = 190 * 1024;

    if(archivo.size > pesoMaximo){

        Swal.fire({
            icon:'error',
            title:'Archivo demasiado pesado',
            text:'El PDF sobrepasa el límite permitido de 190 KB'
        });

        event.target.value = "";

        delete archivosPDF[nombre];

        document.getElementById(`estado_${nombre}`).innerHTML = `
            <span class="badge bg-danger">
                Pendiente
            </span>
        `;

        verificarDocumentos();

        return;
    }

    archivosPDF[nombre] = archivo;

    document.getElementById(`estado_${nombre}`).innerHTML = `
        <span class="badge bg-success">
            Cargado
        </span>
    `;

    verificarDocumentos();
}


// 🔎 VERIFICAR
function verificarDocumentos(){

    if(
        Object.keys(archivosPDF).length === documentosPDF.length
    ){

        document.getElementById(
            "btnGenerarCarpeta"
        ).style.display = "inline-block";
    }
}


// 📦 ZIP
async function generarCarpeta(){

    const confirm = await Swal.fire({

        title:'¿Generar carpeta?',
        text:'Se descargará un archivo ZIP',
        icon:'question',
        showCancelButton:true,
        confirmButtonColor:'#198754'
    });

    if(!confirm.isConfirmed) return;

    const zip = new JSZip();

    documentosPDF.forEach(doc=>{

        zip.file(
            `${doc.id}.pdf`,
            archivosPDF[doc.id]
        );
    });

    const contenido = await zip.generateAsync({

        type: "blob",

        compression: "DEFLATE",

        compressionOptions: {
            level: 9
        }
    });

    const url = window.URL.createObjectURL(contenido);

    const a = document.createElement("a");

    a.href = url;

    a.download = `CARPETA_${localStorage.getItem("alumno")}.zip`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    window.URL.revokeObjectURL(url);

    Swal.fire({

        icon:'success',
        title:'Carpeta generada',
        text:'La descarga comenzará automáticamente'
    });
}