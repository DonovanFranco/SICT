document.addEventListener("DOMContentLoaded", () => {

    /*
    =====================================
      🔐 PROTECCIÓN DE ACCESO POR FECHA
    =====================================
    */
    const fechaGuardada = localStorage.getItem("fechaCita");
    const horaGuardada = localStorage.getItem("horaCita");

    if (!fechaGuardada || !horaGuardada) {

        // Limpiar posibles datos
        localStorage.removeItem("datosAlumno");
        localStorage.removeItem("datosParciales");

        // Redirigir a selección de fecha
        window.location.replace("estudiantes-fecha.html");
        return;
    }


    /*
    =====================================
      ALERTAS BONITAS BOOTSTRAP
    =====================================
    */
    function mostrarAlerta(mensaje, tipo = "danger") {

        const alertaBox = document.getElementById("alertaBox");

        const alerta = document.createElement("div");
        alerta.className = `alert alert-${tipo} alert-dismissible fade show shadow`;
        alerta.role = "alert";

        alerta.innerHTML = `
            <strong>${tipo === "danger" ? "⚠ Error:" : "✔"} </strong> ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        alertaBox.innerHTML = "";
        alertaBox.appendChild(alerta);

        setTimeout(() => {
            alerta.classList.remove("show");
            alerta.classList.add("hide");
        }, 4000);
    }

    function confirmarAccion(mensaje, callbackSi) {

        const alertaBox = document.getElementById("confirmBox");

        const confirmar = document.createElement("div");
        confirmar.className = "alert alert-warning shadow";

        confirmar.innerHTML = `
            <strong>⚠ Confirmación</strong><br><br>
            ${mensaje}
            <div class="mt-3 text-end">
                <button class="btn btn-sm btn-secondary me-2" id="noBtn">No</button>
                <button class="btn btn-sm btn-danger" id="siBtn">Sí</button>
            </div>
        `;

        alertaBox.innerHTML = "";
        alertaBox.appendChild(confirmar);

        document.getElementById("siBtn").onclick = callbackSi;
        document.getElementById("noBtn").onclick = () => confirmar.remove();
    }


    /*
    =====================================
      MOSTRAR FECHA Y HORA
    =====================================
    */
    const fecha = fechaGuardada;
    const hora = horaGuardada;
    const info = document.getElementById("infoCita");

    if (fecha && hora) {
        const f = new Date(fecha + "T00:00:00");

        const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
        const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

        info.textContent =
            `${dias[f.getDay()]}, ${f.getDate()} de ${meses[f.getMonth()]}, ${hora.replace("AM","a.m.").replace("PM","p.m.")}`;
    } else {
        info.textContent = "No se encontró información de la cita.";
    }


    /*
    =====================================
      TITULACION INTEGRAL
    =====================================
    */
    const opcionTitulacion = document.getElementById("opcionTitulacion");
    const integralBox = document.getElementById("integralOpciones");

    if (opcionTitulacion) {
        opcionTitulacion.addEventListener("change", () => {
            integralBox.style.display =
                opcionTitulacion.value === "Titulacion Integral" ? "block" : "none";
        });
    }

        /*
    =====================================
      BLOQUEO AUTOMÁTICO DE INTEGRANTES (EGEL = 1)
    =====================================
    */
    const tipoIntegralSelect = document.getElementById("tipoIntegral");
    const numIntegrantesSelect = document.getElementById("numIntegrantes");

    function controlarIntegrantesEGEL() {

        const opcionActual = opcionTitulacion?.value;
        const tipoActual = tipoIntegralSelect?.value;

        if (
            opcionActual === "Titulacion Integral" &&
            tipoActual === "EGEL"
        ) {
            numIntegrantesSelect.value = "1";
            numIntegrantesSelect.disabled = true;
        } else {
            numIntegrantesSelect.disabled = false;
        }
    }

    // Detectar cambios
    if (tipoIntegralSelect) {
        tipoIntegralSelect.addEventListener("change", controlarIntegrantesEGEL);
    }

    if (opcionTitulacion) {
        opcionTitulacion.addEventListener("change", controlarIntegrantesEGEL);
    }

    // Ejecutar al cargar por si ya hay valores
    controlarIntegrantesEGEL();



    /*
    =====================================
      CANCELAR
    =====================================
    */
    const btnCancelar = document.getElementById("btnCancelar");

    if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {

            confirmarAccion(
                "Si cancelas perderás el progreso actual. ¿Deseas continuar?",
                () => {
                    localStorage.removeItem("fechaCita");
                    localStorage.removeItem("horaCita");
                    localStorage.removeItem("fechaCita");
                    localStorage.removeItem("horaCita");
                    localStorage.removeItem("inicioSesionCita");
                    localStorage.removeItem("datosParciales");
                    window.location.href = "estudiantes-fecha.html";
                }
            );
        });
    }


    /*
    =====================================
      VALIDACIÓN Y ENVÍO
    =====================================
    */
    const form = document.getElementById("formDatos");

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const control = document.getElementById("control").value.trim();
        const nombreInput = document.getElementById("nombre");
        const nombre = nombreInput.value.trim().toUpperCase();
        nombreInput.value = nombre;
        const curp = document.getElementById("curp").value.trim().toUpperCase();
        const carrera = document.getElementById("carrera").value;
        const correo = document.getElementById("correo").value.trim().toLowerCase();
        const telefono = document.getElementById("telefono").value.trim();
        const opcion = opcionTitulacion.value;


        if (!/^\d{8}$/.test(control)) {
            mostrarAlerta("El número de control debe tener 8 dígitos numéricos.");
            return;
        }

        if (!/^[A-ZÁÉÍÓÚÑ ]{10,}$/.test(nombre)) {
            mostrarAlerta("El nombre debe estar en MAYÚSCULAS y completo.");
            return;
        }

        if (!validarCURP(curp)) {
            mostrarAlerta("La CURP no es válida.");
            return;
        }

        if (!correo) {
            mostrarAlerta("Debes ingresar un correo electrónico.");
            return;
        }

        if (!/^[^\s@]+@(pachuca\.tecnm\.mx|gmail\.com|hotmail\.com|yahoo\.com)$/i.test(correo)) {
            mostrarAlerta("Correo no válido. Usa institucional, Gmail, Hotmail o Yahoo.");
            return;
        }


        if (!/^\d{10}$/.test(telefono)) {
            mostrarAlerta("El número telefónico debe tener 10 dígitos.");
            return;
        }
        if (!validarCodigoAcceso()) {
            mostrarAlerta("El código de acceso no cumple con el formato requerido", "danger");
            return;
        }

        if (!opcion) {
            mostrarAlerta("Selecciona una opción de titulación.");
            return;
        }

        let tipoIntegral = "";
        let numIntegrantes = "";

        if (opcion === "Titulacion Integral") {

            tipoIntegral = document.getElementById("tipoIntegral").value;
            numIntegrantes = document.getElementById("numIntegrantes").value;

            if (!tipoIntegral) {
                mostrarAlerta("Selecciona el tipo de Titulación Integral.");
                return;
            }

            if (!numIntegrantes) {
                mostrarAlerta("Selecciona el número de integrantes.");
                return;
            }
        }

        const datos = {
            control,
            nombre,
            curp,
            carrera,
            correo,
            telefono,
            opcion,
            tipoIntegral,
            numIntegrantes,
            observaciones: document.getElementById("observaciones").value
        };

        localStorage.setItem("datosAlumno", JSON.stringify(datos));

        window.location.href = "confirmar.html";
    });

});


/*
=====================================
  MODO PRO - MEJORAS UX/UI
=====================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const control = document.getElementById("control");
    const nombre = document.getElementById("nombre");
    const curp = document.getElementById("curp");
    const correo = document.getElementById("correo");
    const telefono = document.getElementById("telefono");
    const observaciones = document.getElementById("observaciones");

    telefono.addEventListener("input", () => {
        telefono.value = telefono.value.replace(/\D/g, "").slice(0, 10);
        validarCampo(telefono, /^\d{10}$/);
        guardarParcial();
    });

    curp.addEventListener("input", () => {
        curp.value = curp.value.toUpperCase();

        if (validarCURP(curp.value)) {
            curp.classList.remove("is-invalid");
            curp.classList.add("is-valid");
        } else {
            curp.classList.remove("is-valid");
            curp.classList.add("is-invalid");
        }

        guardarParcial();
    });

    nombre.addEventListener("input", () => {
        nombre.value = nombre.value.toUpperCase();
        validarCampo(nombre, /^[A-ZÁÉÍÓÚÑ ]{10,}$/);
        guardarParcial();
    });

    control.addEventListener("input", () => {
        validarCampo(control, /^\d{8}$/);
        guardarParcial();
    });

    correo.addEventListener("input", () => {
        validarCampo(
            correo,
            /^[^\s@]+@(pachuca\.tecnm\.mx|gmail\.com|hotmail\.com|yahoo\.com)$/i
        );
        guardarParcial();
    });

    if (observaciones) {

        const contador = document.createElement("small");
        contador.className = "text-muted float-end";
        observaciones.parentNode.appendChild(contador);

        observaciones.addEventListener("input", () => {
            contador.textContent = `${observaciones.value.length} caracteres`;
            guardarParcial();
        });
    }

    function validarCampo(input, regex) {

        if (regex.test(input.value)) {
            input.classList.remove("is-invalid");
            input.classList.add("is-valid");
        } else {
            input.classList.remove("is-valid");
            input.classList.add("is-invalid");
        }
    }

    function guardarParcial() {

        const parcial = {
            control: control.value,
            nombre: nombre.value,
            curp: curp?.value || "",
            correo: correo.value,
            telefono: telefono.value,
            observaciones: observaciones?.value || ""
        };

        localStorage.setItem("datosParciales", JSON.stringify(parcial));
    }

    const datosGuardados = JSON.parse(localStorage.getItem("datosParciales"));

    if (datosGuardados) {
        control.value = datosGuardados.control || "";
        nombre.value = datosGuardados.nombre || "";
        if (curp) curp.value = datosGuardados.curp || "";
        correo.value = datosGuardados.correo || "";
        telefono.value = datosGuardados.telefono || "";
        if (observaciones) observaciones.value = datosGuardados.observaciones || "";
    }

});

/*
=====================================
  CONTROL DE SESIÓN + CONTADOR VISUAL
=====================================
*/

document.addEventListener("DOMContentLoaded", () => {

    const DURACION_SESION = 10 * 60 * 1000; // 10 minutos
    const ahora = Date.now();

    let inicioSesion = localStorage.getItem("inicioSesionCita");

    /*
    =============================
      INICIAR SESIÓN
    =============================
    */
    if (!inicioSesion) {
        localStorage.setItem("inicioSesionCita", ahora);
        inicioSesion = ahora;

        if (typeof mostrarAlerta === "function") {
            mostrarAlerta(
                "⏳ Tienes 10 minutos para completar tus datos o la cita será liberada.",
                "warning"
            );
        }
    }

    inicioSesion = parseInt(inicioSesion);

    /*
    =============================
      SI YA EXPIRÓ
    =============================
    */
    if (ahora - inicioSesion > DURACION_SESION) {
        expirarSesion();
        return;
    }

    /*
    =============================
      CONTADOR VISUAL
    =============================
    */
    const timerElement = document.getElementById("sessionTimer");

    const intervalo = setInterval(() => {

        const transcurrido = Date.now() - inicioSesion;
        const restante = DURACION_SESION - transcurrido;

        if (restante <= 0) {
            clearInterval(intervalo);
            expirarSesion();
            return;
        }

        const minutos = Math.floor(restante / 60000);
        const segundos = Math.floor((restante % 60000) / 1000);

        const tiempoTexto =
            `${minutos}:${segundos.toString().padStart(2, "0")}`;

        if (timerElement) {
            timerElement.textContent = `⏳ Tiempo restante: ${tiempoTexto}`;
        }

        /*
        =============================
          ALERTA 2 MIN RESTANTES
        =============================
        */
        if (restante <= 2 * 60 * 1000 && restante > 119000) {
            if (typeof mostrarAlerta === "function") {
                mostrarAlerta(
                    "⚠ Te quedan menos de 2 minutos. Si no terminas, perderás la cita.",
                    "warning"
                );
            }
        }

        /*
        =============================
          COLOR ROJO ÚLTIMO MINUTO
        =============================
        */
        if (restante <= 60 * 1000 && timerElement) {
            timerElement.classList.remove("bg-primary", "bg-warning");
            timerElement.classList.add("bg-danger");
        } else if (restante <= 2 * 60 * 1000 && timerElement) {
            timerElement.classList.remove("bg-primary");
            timerElement.classList.add("bg-warning");
        }

    }, 1000);


    /*
    =============================
      EXPIRAR SESIÓN
    =============================
    */
    function expirarSesion() {

        localStorage.removeItem("fechaCita");
        localStorage.removeItem("horaCita");
        localStorage.removeItem("inicioSesionCita");
        localStorage.removeItem("datosParciales");

        if (typeof mostrarAlerta === "function") {
            mostrarAlerta(
                "⏰ Tu sesión expiró. La cita fue liberada, selecciona un nuevo horario.",
                "danger"
            );
        } else {
            alert("Tu sesión expiró. La cita fue liberada.");
        }

        setTimeout(() => {
            window.location.href = "estudiantes-fecha.html";
        }, 2500);
    }

});

function validarCodigoAcceso() {
  const codigo = document.getElementById("codigo").value;
  const error = document.getElementById("errorCodigo");

  // Min 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!regex.test(codigo)) {
    error.style.display = "block";
    return false;
  }

  error.style.display = "none";
  return true;
}


function validarCURP(curp) {
  curp = curp.toUpperCase().trim();

  const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

  if (!regex.test(curp)) return false;

  // Validar fecha real
  const fecha = curp.substring(4, 10);
  const anio = parseInt(fecha.substring(0, 2));
  const mes = parseInt(fecha.substring(2, 4));
  const dia = parseInt(fecha.substring(4, 6));

  if (mes < 1 || mes > 12) return false;
  if (dia < 1 || dia > 31) return false;

  return true;
}

/*
=====================================
  MOSTRAR CONTRASEÑA MIENTRAS PRESIONA 👁️
=====================================
*/

document.addEventListener("DOMContentLoaded", () => {

  const passwordInput = document.getElementById("codigo");
  const toggleIcon = document.getElementById("togglePassword");

  if (!passwordInput || !toggleIcon) return;

  // Mostrar mientras presiona
  toggleIcon.addEventListener("mousedown", () => {
    passwordInput.type = "text";
  });

  // Ocultar al soltar
  toggleIcon.addEventListener("mouseup", () => {
    passwordInput.type = "password";
  });

  // Si suelta fuera del icono
  toggleIcon.addEventListener("mouseleave", () => {
    passwordInput.type = "password";
  });

  // Para móviles (touch)
  toggleIcon.addEventListener("touchstart", () => {
    passwordInput.type = "text";
  });

  toggleIcon.addEventListener("touchend", () => {
    passwordInput.type = "password";
  });

});

async function registrarCita() {

  const alerta = document.getElementById("alertaBox");
  alerta.innerHTML = "";

  /* =========================
     OBTENER DATOS
  ========================= */
  const data = {
    no_control: document.getElementById("control").value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    curp: document.getElementById("curp").value.trim(),
    carrera: document.getElementById("carrera").value,
    correo: document.getElementById("correo").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    codigo_acceso: document.getElementById("codigo").value.trim(),
    opcion_titulacion: document.getElementById("opcionTitulacion").value,
    tipo_integral: document.getElementById("tipoIntegral").value || "",
    num_integrantes: document.getElementById("numIntegrantes").value || 1,
    observaciones: document.getElementById("observaciones").value || "",
    fecha: localStorage.getItem("fechaCita"),
    hora: convertirHora24(localStorage.getItem("horaCita"))
  };

  /* =========================
     VALIDACIÓN
  ========================= */
  if (!data.no_control || !data.nombre || !data.correo || !data.telefono || !data.codigo_acceso) {
    alerta.innerHTML = `<div class="alert alert-danger">Faltan datos obligatorios</div>`;
    return;
  }
  if (!validarCURP(data.curp)) {
    alerta.innerHTML = `<div class="alert alert-danger">CURP inválida</div>`;
    return;
}

  try {

    const res = await fetch("php/registrar_cita.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const text = await res.text();

    if (!text) {
      alerta.innerHTML = `<div class="alert alert-danger">El servidor no respondió</div>`;
      return;
    }

    const result = JSON.parse(text);

    if (result.status === "ok") {
      alerta.innerHTML = `<div class="alert alert-success">✔ Registro exitoso. Redirigiendo...</div>`;
      setTimeout(() => {
        window.location.href = "ingresar.html";
      }, 2000);
    } else {
      alerta.innerHTML = `<div class="alert alert-danger">${result.msg}</div>`;
    }

  } catch (error) {
    console.error(error);
    alerta.innerHTML = `<div class="alert alert-danger">Error de conexión con el servidor</div>`;
  }
}
function convertirHora24(hora12) {
  if (!hora12) return "";

  const [horaMin, periodo] = hora12.split(" ");
  let [hora, minutos] = horaMin.split(":");

  hora = parseInt(hora);

  if (periodo === "PM" && hora !== 12) hora += 12;
  if (periodo === "AM" && hora === 12) hora = 0;

  return `${hora.toString().padStart(2, "0")}:${minutos}:00`;
}

