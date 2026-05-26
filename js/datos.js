document.addEventListener("DOMContentLoaded", () => {

    // 1. SELECTORES PRINCIPALES
    const form = document.getElementById("formDatos");
    const control = document.getElementById("control");
    const nombre = document.getElementById("nombre");
    const curp = document.getElementById("curp");
    const carrera = document.getElementById("carrera");
    const correo = document.getElementById("correo");
    const telefono = document.getElementById("telefono");
    const codigoInput = document.getElementById("codigo");
    const opcionTitulacion = document.getElementById("opcionTitulacion");
    const tipoIntegralSelect = document.getElementById("tipoIntegral");
    const numIntegrantesSelect = document.getElementById("numIntegrantes");
    const observaciones = document.getElementById("notas"); // Textarea del HTML
    const integralBox = document.getElementById("integralOpciones");
    const btnCancelar = document.getElementById("btnCancelar");
    const toggleIcon = document.getElementById("togglePassword");
    const info = document.getElementById("infoCita");

    // 2. PROTECCIÓN DE ACCESO POR FECHA
    const fechaGuardada = localStorage.getItem("fechaCita");
    const horaGuardada = localStorage.getItem("horaCita");

    if (!fechaGuardada || !horaGuardada) {
        localStorage.removeItem("datosAlumno");
        localStorage.removeItem("datosParciales");
        window.location.replace("estudiantes-fecha.html");
        return;
    }

    // 3. DESPLIEGUE DE FECHA Y HORA DE LA CITA
    if (info) {
        const f = new Date(fechaGuardada + "T00:00:00");
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        info.textContent = `${dias[f.getDay()]} ${f.getDate()} de ${meses[f.getMonth()]} de ${f.getFullYear()}, ${horaGuardada.replace("AM", "a.m.").replace("PM", "p.m.")}`;
    }

    // 4. CONTROLADOR DINÁMICO DE INTEGRANTES (EGEL)
    function controlarIntegrantesEGEL() {
        const opcionActual = opcionTitulacion?.value;
        const tipoActual = tipoIntegralSelect?.value;

        if (numIntegrantesSelect) {
            if (opcionActual === "Titulacion Integral" && tipoActual === "EGEL") {
                numIntegrantesSelect.value = "1";
                numIntegrantesSelect.disabled = true;
                numIntegrantesSelect.classList.remove("is-invalid");
                numIntegrantesSelect.classList.add("is-valid");
            } else {
                numIntegrantesSelect.disabled = false;
            }
        }
    }

    if (opcionTitulacion && integralBox) {
        opcionTitulacion.addEventListener("change", () => {
            integralBox.style.display = opcionTitulacion.value === "Titulacion Integral" ? "block" : "none";
            if (opcionTitulacion.value !== "Titulacion Integral") {
                limpiarEstilosCampos([tipoIntegralSelect, numIntegrantesSelect]);
            }
            controlarIntegrantesEGEL();
            guardarParcial();
        });
    }

    if (tipoIntegralSelect) {
        tipoIntegralSelect.addEventListener("change", () => {
            controlarIntegrantesEGEL();
            marcarSelect(tipoIntegralSelect);
            guardarParcial();
        });
    }

    if (numIntegrantesSelect) {
        numIntegrantesSelect.addEventListener("change", () => {
            marcarSelect(numIntegrantesSelect);
            guardarParcial();
        });
    }

    // 5. VALIDACIÓN EN TIEMPO REAL CON COMENTARIOS VISUALES
    if (control) {
        control.addEventListener("input", () => {
            control.value = control.value.replace(/\D/g, "").slice(0, 8);
            validarCampo(control, /^\d{8}$/);
            guardarParcial();
        });

        nombre.addEventListener("input", () => {
            nombre.value = nombre.value.toUpperCase();
            validarCampo(nombre, /^[A-ZÁÉÍÓÚÑ ]{10,}$/);
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

        carrera.addEventListener("change", () => {
            marcarSelect(carrera);
            guardarParcial();
        });

        correo.addEventListener("input", () => {
            validarCampo(correo, /^[^\s@]+@(pachuca\.tecnm\.mx|gmail\.com|hotmail\.com|yahoo\.com)$/i);
            guardarParcial();
        });

        telefono.addEventListener("input", () => {
            telefono.value = telefono.value.replace(/\D/g, "").slice(0, 10);
            validarCampo(telefono, /^\d{10}$/);
            guardarParcial();
        });

        if (codigoInput) {
            codigoInput.addEventListener("input", validarCodigoAcceso);
        }
    }

    if (observaciones) {
        const contador = document.createElement("small");
        contador.className = "text-muted float-end";
        observaciones.parentNode.appendChild(contador);
        observaciones.addEventListener("input", () => {
            contador.textContent = `${observaciones.value.length} caracteres`;
            guardarParcial();
        });
    }

    // 6. EVENTOS DE SEGURIDAD PARA MOSTRAR/OCULTAR CONTRASEÑA (SOPORTA TOUCH)
    if (codigoInput && toggleIcon) {
        const mostrarPassword = (e) => {
            e.preventDefault();
            codigoInput.type = "text";
        };
        const ocultarPassword = (e) => {
            e.preventDefault();
            codigoInput.type = "password";
        };

        toggleIcon.addEventListener("mousedown", mostrarPassword);
        toggleIcon.addEventListener("mouseup", ocultarPassword);
        toggleIcon.addEventListener("mouseleave", ocultarPassword);
        toggleIcon.addEventListener("touchstart", mostrarPassword, {passive: false});
        toggleIcon.addEventListener("touchend", ocultarPassword, {passive: false});
    }

    // 7. BOTÓN CANCELAR PROGRESO
    if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {
            confirmarAccion(
                "Si cancelas perderás el progreso actual. ¿Deseas continuar?",
                () => {
                    localStorage.removeItem("fechaCita");
                    localStorage.removeItem("horaCita");
                    localStorage.removeItem("inicioSesionCita");
                    localStorage.removeItem("datosParciales");
                    localStorage.removeItem("datosAlumno");
                    window.location.href = "estudiantes-fecha.html";
                }
            );
        });
    }

    // 8. ENVÍO DEL FORMULARIO Y CONSTRUCCIÓN ESTRUCTURA DE DATOS
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const controlVal = control.value.trim();
            const nombreVal = nombre.value.trim().toUpperCase();
            const curpVal = curp.value.trim().toUpperCase();
            const carreraVal = carrera.value;
            const correoVal = correo.value.trim().toLowerCase();
            const telefonoVal = telefono.value.trim();
            const opcionVal = opcionTitulacion.value;

            // Bloque de Validaciones Estrictas
            if (!/^\d{8}$/.test(controlVal)) return mostrarAlerta("El número de control debe tener 8 dígitos.");
            if (!/^[A-ZÁÉÍÓÚÑ ]{10,}$/.test(nombreVal)) return mostrarAlerta("El nombre debe contener mínimo 10 caracteres.");
            if (!validarCURP(curpVal)) return mostrarAlerta("La CURP ingresada no es válida.");
            if (!/^[^\s@]+@(pachuca\.tecnm\.mx|gmail\.com|hotmail\.com|yahoo\.com)$/i.test(correoVal)) return mostrarAlerta("Dominio de correo no permitido.");
            if (!/^\d{10}$/.test(telefonoVal)) return mostrarAlerta("El número telefónico debe tener 10 dígitos numéricos.");
            if (!validarCodigoAcceso()) return mostrarAlerta("La contraseña no cumple los requisitos.");

            // Mapeo condicional en base a la opción elegida
            let tipoIntegral = "Individual";
            let numIntegrantes = 1;

            if (opcionVal === "Titulacion Integral") {
                tipoIntegral = tipoIntegralSelect.value;
                numIntegrantes = numIntegrantesSelect.value;
                if (!tipoIntegral || !numIntegrantes) return mostrarAlerta("Por favor completa los campos de Titulación Integral.");
            }

            const datosCita = {
                no_control: controlVal,
                nombre: nombreVal,
                curp: curpVal,
                carrera: carreraVal,
                correo: correoVal,
                telefono: telefonoVal,
                codigo_acceso: codigoInput.value.trim(),
                opcion_titulacion: opcionVal,
                tipo_integral: tipoIntegral,
                num_integrantes: parseInt(numIntegrantes) || 1,
                observaciones: observaciones.value || "", // Viaja como observaciones pero PHP lo mete en la columna 'notas' de 'alumno'
                fecha: localStorage.getItem("fechaCita"),
                hora: convertirHora24(localStorage.getItem("horaCita"))
            };

            localStorage.setItem("datosAlumno", JSON.stringify(datosCita));
            ejecutarModalConfirmacion(datosCita);
        });
    }

    // 9. HIDRATACIÓN O RECUPERACIÓN AUTOMÁTICA DEL FORMULARIO
    const datosGuardados = JSON.parse(localStorage.getItem("datosParciales"));
    if (datosGuardados && control) {
        control.value = datosGuardados.control || "";
        nombre.value = datosGuardados.nombre || "";
        if (curp) curp.value = datosGuardados.curp || "";
        carrera.value = datosGuardados.carrera || "";
        correo.value = datosGuardados.correo || "";
        telefono.value = datosGuardados.telefono || "";
        opcionTitulacion.value = datosGuardados.opcionTitulacion || "";
        
        if (opcionTitulacion.value === "Titulacion Integral" && integralBox) {
            integralBox.style.display = "block";
            if (tipoIntegralSelect) tipoIntegralSelect.value = datosGuardados.tipoIntegral || "";
            if (numIntegrantesSelect) numIntegrantesSelect.value = datosGuardados.numIntegrantes || "";
        }
        if (observaciones) observaciones.value = datosGuardados.observaciones || "";

        if (control.value) validarCampo(control, /^\d{8}$/);
        if (nombre.value) validarCampo(nombre, /^[A-ZÁÉÍÓÚÑ ]{10,}$/);
        if (curp && curp.value) curp.classList.add(validarCURP(curp.value) ? "is-valid" : "is-invalid");
        if (carrera.value) marcarSelect(carrera);
        if (correo.value) validarCampo(correo, /^[^\s@]+@(pachuca\.tecnm\.mx|gmail\.com|hotmail\.com|yahoo\.com)$/i);
        if (telefono.value) validarCampo(telefono, /^\d{10}$/);
        if (opcionTitulacion.value) marcarSelect(opcionTitulacion);
        controlarIntegrantesEGEL();
    }

    function guardarParcial() {
        if (!control) return;
        const parcial = {
            control: control.value,
            nombre: nombre.value,
            curp: curp?.value || "",
            carrera: carrera.value,
            correo: correo.value,
            telefono: telefono.value,
            opcionTitulacion: opcionTitulacion.value,
            tipoIntegral: tipoIntegralSelect?.value || "",
            numIntegrantes: numIntegrantesSelect?.value || "",
            observaciones: observaciones?.value || ""
        };
        localStorage.setItem("datosParciales", JSON.stringify(parcial));
    }
});

// 10. REGLAS AUXILIARES GLOBALES
function validarCampo(input, regex) {
    if (input.value.trim() === "") {
        input.classList.remove("is-valid", "is-invalid");
        return;
    }
    const esValido = regex.test(input.value);
    input.classList.toggle("is-valid", esValido);
    input.classList.toggle("is-invalid", !esValido);
}

function marcarSelect(selectElement) {
    if (!selectElement) return;
    const esValido = selectElement.value !== "";
    selectElement.classList.toggle("is-valid", esValido);
    selectElement.classList.toggle("is-invalid", !esValido);
}

function limpiarEstilosCampos(campos) {
    campos.forEach(campo => {
        if (campo) {
            campo.value = "";
            campo.classList.remove("is-valid", "is-invalid");
        }
    });
}

function validarCodigoAcceso() {
    const codigoInput = document.getElementById("codigo");
    const error = document.getElementById("errorCodigo");
    if (!codigoInput) return false;
    
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    const esValido = regex.test(codigoInput.value);

    if (error) error.style.display = esValido ? "none" : "block";
    codigoInput.classList.toggle("is-valid", esValido);
    codigoInput.classList.toggle("is-invalid", !esValido);
    return esValido;
}

function validarCURP(curp) {
    curp = curp.toUpperCase().trim();
    const regex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    if (!regex.test(curp)) return false;

    const mes = parseInt(curp.substring(6, 8));
    const dia = parseInt(curp.substring(8, 10));
    return (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31);
}

function mostrarAlerta(mensaje, tipo = "danger") {
    const alertaBox = document.getElementById("alertaBox");
    if (!alertaBox) return;

    const alerta = document.createElement("div");
    alerta.className = `alert alert-${tipo} alert-dismissible fade show shadow`;
    alerta.innerHTML = `<strong>${tipo === "danger" ? "⚠ Error:" : "✔"} </strong> ${mensaje}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;

    alertaBox.innerHTML = "";
    alertaBox.appendChild(alerta);

    setTimeout(() => {
        alerta.classList.remove("show");
        setTimeout(() => alerta.remove(), 250);
    }, 4000);
}

function confirmarAccion(mensaje, callbackSi) {
    const alertaBox = document.getElementById("confirmBox");
    if (!alertaBox) return;

    const confirmar = document.createElement("div");
    confirmar.className = "alert alert-warning shadow";
    confirmar.innerHTML = `<strong>⚠ Confirmación</strong><br><br>${mensaje}<div class="mt-3 text-end"><button class="btn btn-sm btn-secondary me-2" id="noBtn">No</button><button class="btn btn-sm btn-danger" id="siBtn">Sí</button></div>`;

    alertaBox.innerHTML = "";
    alertaBox.appendChild(confirmar);

    document.getElementById("siBtn").onclick = callbackSi;
    document.getElementById("noBtn").onclick = () => confirmar.remove();
}

function ejecutarModalConfirmacion(data) {
    const alerta = document.getElementById("alertaBox");
    if (!alerta) return;
    alerta.innerHTML = "";

    const modal = document.getElementById("modalConfirm");
    const btnConfirmar = document.getElementById("btnConfirmar");
    const btnRevisar = document.getElementById("btnRevisar");

    if (modal) modal.style.display = "flex";
    if (btnRevisar) btnRevisar.onclick = () => { modal.style.display = "none"; };

    if (btnConfirmar) {
        btnConfirmar.onclick = async () => {
            modal.style.display = "none";
            try {
                const res = await fetch("php/registrar_cita.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const text = await res.text();
                if (!text) {
                    alerta.innerHTML = `<div class="alert alert-danger">El servidor no respondió. Inténtalo de nuevo.</div>`;
                    return;
                }

                const result = JSON.parse(text);
                if (result.status === "ok") {
                    alerta.innerHTML = `<div class="alert alert-success">✔ Registro exitoso. Redirigiendo a la pantalla de ingreso...</div>`;
                    localStorage.removeItem("fechaCita");
                    localStorage.removeItem("horaCita");
                    localStorage.removeItem("inicioSesionCita");
                    localStorage.removeItem("datosParciales");
                    localStorage.removeItem("datosAlumno");

                    const formElement = document.getElementById("formDatos");
                    if (formElement) formElement.reset();
                    document.querySelectorAll(".is-valid, .is-invalid").forEach(el => el.classList.remove("is-valid", "is-invalid"));

                    setTimeout(() => { window.location.replace("ingreso-estudiante.html"); }, 2000);
                } else {
                    alerta.innerHTML = `<div class="alert alert-danger">⚠ ${result.msg}</div>`;
                }
            } catch (error) {
                alerta.innerHTML = `<div class="alert alert-danger">Error crítico de comunicación con el servidor.</div>`;
            }
        };
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

// CONTROLADOR DE TIEMPO DE EXPIRACIÓN DE SESIÓN (10 MINUTOS)
document.addEventListener("DOMContentLoaded", () => {
    const DURACION_SESION = 10 * 60 * 1000; 
    const ahora = Date.now();
    let inicioSesion = localStorage.getItem("inicioSesionCita") || ahora;

    if (!localStorage.getItem("inicioSesionCita")) {
        localStorage.setItem("inicioSesionCita", ahora);
    }

    inicioSesion = parseInt(inicioSesion);
    if (ahora - inicioSesion > DURACION_SESION) { return expirarSesion(); }

    const timerElement = document.getElementById("sessionTimer");
    const intervalo = setInterval(() => {
        const restante = DURACION_SESION - (Date.now() - inicioSesion);

        if (restante <= 0) {
            clearInterval(intervalo);
            expirarSesion();
            return;
        }

        const minutos = Math.floor(restante / 60000);
        const segundos = Math.floor((restante % 60000) / 1000);

        if (timerElement) {
            timerElement.textContent = `⏳ Tiempo restante: ${minutos}:${segundos.toString().padStart(2, "0")}`;
            if (restante <= 60 * 1000) {
                timerElement.className = "badge bg-danger fs-6 shadow";
            } else if (restante <= 2 * 60 * 1000) {
                timerElement.className = "badge bg-warning text-dark fs-6 shadow";
            }
        }
    }, 1000);

    function expirarSesion() {
        localStorage.removeItem("fechaCita");
        localStorage.removeItem("horaCita");
        localStorage.removeItem("inicioSesionCita");
        localStorage.removeItem("datosParciales");
        localStorage.removeItem("datosAlumno");
        window.location.href = "estudiantes-fecha.html";
    }
});