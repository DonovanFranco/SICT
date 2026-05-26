document.addEventListener("DOMContentLoaded", () => {

    const btnLogin = document.getElementById("btnLogin");
    if (btnLogin) {
        btnLogin.addEventListener("click", loginAlumno);
    }

    // Escuchar el clic del botón de continuar dentro de la modal de recuperación
    const btnEnviarCorreo = document.getElementById("btnEnviarCorreo");
    if (btnEnviarCorreo) {
        btnEnviarCorreo.addEventListener("click", recuperarContrasena);
    }

});

function loginAlumno() {

    const no_control = document.getElementById("control").value.trim();
    const codigo     = document.getElementById("codigo").value.trim();

    if (!no_control || !codigo) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor complete todos los campos.',
            confirmButtonColor: '#0d6efd'
        });
        return;
    }

    fetch("php/login_alumno.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ no_control, codigo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "ok") {
            localStorage.setItem("alumno", no_control);
            Swal.fire({
                icon: 'success',
                title: 'Bienvenido',
                text: 'Acceso correcto',
                showConfirmButton: false,
                timer: 1500
            }).then(() => {
                window.location.href = "egresado-panel.html";
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Acceso denegado',
                text: 'Número de control o código incorrecto.',
                confirmButtonColor: '#dc3545'
            });
        }
    })
    .catch(error => {
        Swal.fire({
            icon: 'error',
            title: 'Error del servidor',
            text: 'Intente nuevamente más tarde.'
        });
        console.error(error);
    });
}

function recuperarContrasena() {
    const correo = document.getElementById("correoRecuperar").value.trim();

    if (!correo) {
        Swal.fire({ icon: 'warning', title: 'Campo obligatorio', text: 'Introduce tu correo.' });
        return;
    }

    fetch("php/recuperar_password.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo }) // El objeto que recibe el PHP
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "ok") {
            Swal.fire({ icon: 'success', title: '¡Éxito!', text: data.msg });
            // Cerrar modal
            const modalEl = document.getElementById('modalRecuperar');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            document.getElementById('correoRecuperar').value = '';
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.msg });
        }
    })
    .catch(error => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Fallo en la comunicación con el servidor.' });
        console.error(error);
    });
}

// CONTROL VISUAL: MOSTRAR/OCULTAR CONTRASEÑA
const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function () {
        const passwordInput = document.getElementById('codigo');
        const icon = document.getElementById('toggleIcon');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        }
    });
}