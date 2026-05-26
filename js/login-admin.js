document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("btnLoginAdmin");

    btn.addEventListener("click", loginAdmin);

});


function loginAdmin(){

    const usuario = document.getElementById("usuario").value.trim();
    const codigo  = document.getElementById("codigo").value.trim();

    if(!usuario || !codigo){

        Swal.fire({
            icon:'warning',
            title:'Campos incompletos',
            text:'Ingrese usuario y contraseña'
        });

        return;
    }

    fetch("php/login_admin.php",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body: JSON.stringify({
            usuario:usuario,
            codigo:codigo
        })

    })
    .then(res=>res.json())

    .then(data=>{

        if(data.status === "ok"){

            // Guardar datos del administrador
            localStorage.setItem("adminUsuario", usuario);
            localStorage.setItem("adminNombre", data.nombre);

            Swal.fire({
                icon:"success",
                title:"Bienvenido administrador",
                timer:1500,
                showConfirmButton:false
            })

            .then(()=>{

                window.location.href="admin-panel.html";

            });

        }else{

            Swal.fire({
                icon:"error",
                title:"Acceso denegado",
                text:data.msg
            });

        }

    })

    .catch(error=>{

        console.error(error);

        Swal.fire({
            icon:"error",
            title:"Error del servidor",
            text:"No se pudo conectar con el sistema"
        });

    });

}

document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordInput = document.getElementById('codigo');
    const icon = document.getElementById('toggleIcon');

    // Alternar el tipo de input
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        // Cambiar a icono de ojo abierto
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    } else {
        passwordInput.type = 'password';
        // Cambiar a icono de ojo cerrado
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    }
});