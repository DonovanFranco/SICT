/*
=====================================
  SISTEMA SICT - SELECCIÓN DE CITA
=====================================
✔ Horarios cada 30 min (9 AM - 2 PM)
✔ Solo fechas válidas 2026
✔ NO permite fines de semana
✔ NO permite fechas pasadas
✔ NO permite el mismo día
✔ Toast centrado
*/

document.addEventListener("DOMContentLoaded", function () {

    const contenedorHorarios = document.getElementById("horarios");
    const inputFecha = document.getElementById("fecha");
    const textoSeleccion = document.getElementById("seleccion");
    const btnContinuar = document.getElementById("btnContinuar");

    let horaSeleccionada = null;

    /*
    =====================================
    TOAST ALERT CENTRADO
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
    RANGOS DE FECHAS VALIDAS 2026
    =====================================
    */
    const rangosValidos = [
        { inicio: "2026-01-27", fin: "2026-02-26" },
        { inicio: "2026-03-02", fin: "2026-03-27" },
        { inicio: "2026-04-13", fin: "2026-05-22" }
    ];

    inputFecha.min = "2026-01-27";
    inputFecha.max = "2026-05-22";

    /*
    =====================================
    CUANDO CAMBIA LA FECHA
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

        // Quitar hora para comparar solo fecha
        hoy.setHours(0,0,0,0);

        /*
        ❌ NO PERMITIR FECHAS PASADAS NI HOY
        */
        if (fecha <= hoy) {
            showToast("⚠ No puedes agendar en fechas pasadas ni el mismo día");
            inputFecha.value = "";
            return;
        }

        const diaSemana = fecha.getDay();

        /*
        ❌ BLOQUEAR FINES DE SEMANA
        */
        if (diaSemana === 0 || diaSemana === 6) {
            showToast("⚠ No se permiten citas en fines de semana");
            inputFecha.value = "";
            return;
        }

        /*
        ❌ VALIDAR RANGOS
        */
        let fechaValida = rangosValidos.some(rango =>
            fechaSeleccionada >= rango.inicio &&
            fechaSeleccionada <= rango.fin
        );

        if (!fechaValida) {
            showToast("⚠ Fecha no disponible");
            inputFecha.value = "";
            return;
        }

        generarHorarios();
    });

    /*
    =====================================
    GENERAR HORARIOS
    =====================================
    */
    async function generarHorarios() {

    contenedorHorarios.innerHTML = "";

    // 🔹 Obtener horarios ocupados desde PHP
    let horariosOcupados = [];

    try {
        const res = await fetch(`/SICT/obtener_horarios_ocupados.php?fecha=${inputFecha.value}`);
        horariosOcupados = await res.json(); // ["11:30","12:00"]
    } catch (error) {
        console.error("Error obteniendo horarios:", error);
    }

    let hora = 9;
    let minutos = 0;
    const horaFin = 14;

    while (hora < horaFin || (hora === horaFin && minutos === 0)) {

        const boton = document.createElement("button");
        boton.classList.add("btn", "btn-outline-primary", "m-1");

        let periodo = hora >= 12 ? "PM" : "AM";
        let hora12 = hora > 12 ? hora - 12 : (hora === 0 ? 12 : hora);
        let minutosTexto = minutos === 0 ? "00" : minutos;

        const horaSQL = `${String(hora).padStart(2,'0')}:${String(minutos).padStart(2,'0')}`;
        const textoHora = `${hora12}:${minutosTexto} ${periodo}`;

        boton.textContent = textoHora;

        /*
        🔴 BLOQUEAR SI ESTÁ OCUPADO
        */
        if (horariosOcupados.includes(horaSQL)) {
            boton.disabled = true;
            boton.classList.remove("btn-outline-primary");
            boton.classList.add("btn-secondary");
            boton.textContent += " (Ocupado)";
        }

        boton.addEventListener("click", function () {

            if (boton.disabled) return;

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

        minutos += 30;
        if (minutos === 60) {
            minutos = 0;
            hora++;
        }
    }
}


    /*
    =====================================
    MOSTRAR FECHA + HORA
    =====================================
    */
    function actualizarTextoSeleccion() {

        if (!inputFecha.value || !horaSeleccionada) {
            btnContinuar.style.display = "none";
            return;
        }

        const fecha = new Date(inputFecha.value + "T00:00:00");

        const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
        const meses = [
            "Enero","Febrero","Marzo","Abril","Mayo","Junio",
            "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
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

        window.location.href = "datos.html";
    });

});
