document.addEventListener("DOMContentLoaded", function () {

    const contenedorHorarios = document.getElementById("horarios");
    const inputFecha = document.getElementById("fecha");
    const textoSeleccion = document.getElementById("seleccion");
    const btnContinuar = document.getElementById("btnContinuar");

    let horaSeleccionada = null;

    /*
    =====================================
    TOAST ALERT
    =====================================
    */
    function showToast(msg, tipo = "error") {

        let toast = document.createElement("div");
        toast.className = `toast-alert ${tipo}`;
        toast.textContent = msg;

        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add("show"), 10);

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /*
    =====================================
    CAMBIO DE FECHA
    =====================================
    */
    inputFecha.addEventListener("change", function () {

        const fechaSeleccionada = inputFecha.value;

        contenedorHorarios.innerHTML = "";
        textoSeleccion.textContent = "";
        btnContinuar.style.display = "none";
        horaSeleccionada = null;

        if (!fechaSeleccionada) return;

        const fecha = new Date(fechaSeleccionada + "T00:00:00");
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        /*
        ❌ NO PASADAS NI HOY
        */
        if (fecha <= hoy) {
            showToast("⚠ No puedes agendar en fechas pasadas ni hoy");
            inputFecha.value = "";
            return;
        }

        /*
        ❌ FINES DE SEMANA
        */
        const diaSemana = fecha.getDay();
        if (diaSemana === 0 || diaSemana === 6) {
            showToast("⚠ No se permiten fines de semana");
            inputFecha.value = "";
            return;
        }

        generarHorarios();
    });

    /*
    =====================================
    GENERAR HORARIOS DESDE BACKEND
    =====================================
    */
    async function generarHorarios() {

        contenedorHorarios.innerHTML = "Cargando...";

        try {

            const res = await fetch(`/SICT/php/disponibilidad.php?fecha=${inputFecha.value}`);
            const data = await res.json();

            contenedorHorarios.innerHTML = "";

            if (!data.valido) {

                if (data.bloqueado) {
                    showToast("🚫 Día bloqueado");
                } else {
                    showToast("⚠ Fecha no disponible");
                }

                inputFecha.value = "";
                return;
            }

            if (data.horarios.length === 0) {
                showToast("⚠ No hay horarios disponibles");
                return;
            }

            data.horarios.forEach(horaSQL => {

                const boton = document.createElement("button");
                boton.classList.add("btn", "btn-outline-primary", "m-1");

                let [h, m] = horaSQL.split(":");
                let hora = parseInt(h);

                let periodo = hora >= 12 ? "PM" : "AM";
                let hora12 = hora > 12 ? hora - 12 : hora;

                let textoHora = `${hora12}:${m} ${periodo}`;

                boton.textContent = textoHora;

                boton.addEventListener("click", function () {

                    document.querySelectorAll("#horarios button")
                        .forEach(btn => {
                            btn.classList.remove("btn-primary");
                            btn.classList.add("btn-outline-primary");
                        });

                    boton.classList.remove("btn-outline-primary");
                    boton.classList.add("btn-primary");

                    horaSeleccionada = textoHora;
                    actualizarTextoSeleccion();
                });

                contenedorHorarios.appendChild(boton);
            });

        } catch (e) {
            console.error(e);
            showToast("Error cargando horarios");
        }
    }

    /*
    =====================================
    MOSTRAR SELECCIÓN
    =====================================
    */
    function actualizarTextoSeleccion() {

        if (!inputFecha.value || !horaSeleccionada) {
            btnContinuar.style.display = "none";
            return;
        }

        const fecha = new Date(inputFecha.value + "T00:00:00");

        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        const meses = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];

        let diaSemana = dias[fecha.getDay()];
        let dia = fecha.getDate();
        let mes = meses[fecha.getMonth()];

        let horaTexto = horaSeleccionada
            .replace("AM", "a.m.")
            .replace("PM", "p.m.");

        textoSeleccion.textContent =
            `${diaSemana}, ${dia} de ${mes}, ${horaTexto}`;

        btnContinuar.style.display = "block";
    }

    /*
    =====================================
    CONTINUAR
    =====================================
    */
    btnContinuar.addEventListener("click", function () {

        localStorage.setItem("fechaCita", inputFecha.value);
        localStorage.setItem("horaCita", horaSeleccionada);

        const modo = localStorage.getItem("modoCita");

        if (modo === "reagendar") {
            window.location.href = "confirmar-cita.html";
        } else {
            window.location.href = "datos.html";
        }
    });

});