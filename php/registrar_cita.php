<?php
// En fase de desarrollo puedes cambiar a 1 para ver errores; en producción dejar en 0
error_reporting(0);
ini_set('display_errors', 0);

// Configurar cabecera para respuesta JSON en formato UTF-8
header('Content-Type: application/json; charset=utf-8');

/*
=========================================================================
  1. CONEXIÓN A LA BASE DE DATOS
=========================================================================
*/
$servidor   = "localhost";
$usuario    = "root";
$password   = "";
$base_datos = "sict_pruebas";

$conexion = new mysqli($servidor, $usuario, $password, $base_datos);

if ($conexion->connect_error) {
    echo json_encode([
        "status" => "error",
        "msg" => "Error interno: No se pudo conectar con la base de datos."
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$conexion->set_charset("utf8mb4");

/*
=========================================================================
  2. RECEPCIÓN Y DECODIFICACIÓN DEL JSON
=========================================================================
*/
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true);

if (!$data) {
    echo json_encode([
        "status" => "error",
        "msg" => "Error: No se recibieron datos válidos en la solicitud."
    ], JSON_UNESCAPED_UNICODE);
    $conexion->close();
    exit;
}

/*
=========================================================================
  3. SANITIZACIÓN Y LÓGICA CONDICIONAL DE TITULACIÓN
=========================================================================
*/
$no_control        = trim($data['no_control']);
$nombre            = mb_strtoupper(trim($data['nombre']), 'UTF-8');
$curp              = mb_strtoupper(trim($data['curp']), 'UTF-8');
$carrera           = trim($data['carrera']);
$correo            = mb_strtolower(trim($data['correo']), 'UTF-8');
$telefono          = trim($data['telefono']);
$codigo_acceso     = trim($data['codigo_acceso']);
$notas_alumno      = !empty($data['observaciones']) ? trim($data['observaciones']) : ""; // Se guardará en la tabla 'alumno'
$fecha             = trim($data['fecha']);
$hora              = trim($data['hora']);

// Captura de la opción seleccionada en el formulario
$opcion_titulacion = trim($data['opcion_titulacion']);

// Regla de Negocio: Mapeo condicional del tipo e integrantes
if ($opcion_titulacion === "Titulacion Integral") {
    $tipo_integral   = !empty($data['tipo_integral']) ? trim($data['tipo_integral']) : null;
    $num_integrantes = !empty($data['num_integrantes']) ? intval($data['num_integrantes']) : 1;
    
    if (empty($tipo_integral)) {
        echo json_encode([
            "status" => "error",
            "msg" => "Error: Debes seleccionar un tipo específico para la Titulación Integral."
        ], JSON_UNESCAPED_UNICODE);
        $conexion->close();
        exit;
    }
} else {
    // Si es cualquier otra opción (Residencia, Tesis independiente, etc.), se fuerza "Individual"
    $tipo_integral   = "Individual";
    $num_integrantes = 1;
}

/*
=========================================================================
  4. VALIDACIÓN DE SEGURIDAD DE CONTRASEÑA EN EL SERVIDOR
=========================================================================
*/
if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $codigo_acceso)) {
    echo json_encode([
        "status" => "error",
        "msg" => "La contraseña suministrada no cumple con los requisitos mínimos de seguridad del servidor."
    ], JSON_UNESCAPED_UNICODE);
    $conexion->close();
    exit;
}

/*
=========================================================================
  5. VALIDACIÓN DE DUPLICADOS (ALUMNO) EN UNA SOLA CONSULTA
=========================================================================
*/
$stmtCheck = $conexion->prepare("SELECT no_control, correo, telefono FROM alumno WHERE no_control = ? OR correo = ? OR telefono = ?");
$stmtCheck->bind_param("sss", $no_control, $correo, $telefono);
$stmtCheck->execute();
$resCheck = $stmtCheck->get_result();

if ($resCheck->num_rows > 0) {
    $fila = $resCheck->fetch_assoc();
    if ($fila['no_control'] === $no_control) {
        $msg = "El Número de Control ($no_control) ya se encuentra registrado en el sistema.";
    } elseif ($fila['correo'] === $correo) {
        $msg = "El Correo Electrónico ($correo) ya está asignado a otro estudiante.";
    } else {
        $msg = "El Número Telefónico ($telefono) ya se encuentra registrado por otro alumno.";
    }
    
    echo json_encode(["status" => "error", "msg" => $msg], JSON_UNESCAPED_UNICODE);
    $stmtCheck->close();
    $conexion->close();
    exit;
}
$stmtCheck->close();

/*
=========================================================================
  6. VALIDACIÓN DE DISPONIBILIDAD DE HORARIO (CITA)
=========================================================================
*/
$stmtCitaCheck = $conexion->prepare("SELECT id_cita FROM cita WHERE fecha = ? AND hora = ?");
$stmtCitaCheck->bind_param("ss", $fecha, $hora);
$stmtCitaCheck->execute();
if ($stmtCitaCheck->get_result()->num_rows > 0) {
    echo json_encode([
        "status" => "error",
        "msg" => "Lo sentimos, el horario seleccionado ($hora) para el día $fecha acaba de ser ocupado. Por favor, selecciona otro."
    ], JSON_UNESCAPED_UNICODE);
    $stmtCitaCheck->close();
    $conexion->close();
    exit;
}
$stmtCitaCheck->close();

/*
=========================================================================
  7. PROCESAMIENTO E INSERCIÓN BD + ENVÍO CORREO (TRANSACCIÓN CONTROLADA)
=========================================================================
*/
// Importamos el archivo que interactúa con PHPMailer y Composer
require_once 'mailer_config.php';

$conexion->begin_transaction();

try {
    // Encriptar contraseña del estudiante para protección en BD
    $password_encriptada = password_hash($codigo_acceso, PASSWORD_BCRYPT);

    // Inserción en la tabla 'alumno' (Aquí se guarda el texto en la columna 'notas')
    // Tipos de parámetros: 10 strings iniciales, 1 entero (num_integrantes) -> total: "ssssssssssi"
    $queryAlumno = "INSERT INTO alumno (no_control, nombre, curp, carrera, correo, telefono, codigo_acceso, opcion_titulacion, notas, tipo_integral, num_integrantes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtAlumno = $conexion->prepare($queryAlumno);
    $stmtAlumno->bind_param("ssssssssssi", $no_control, $nombre, $curp, $carrera, $correo, $telefono, $password_encriptada, $opcion_titulacion, $notas_alumno, $tipo_integral, $num_integrantes);
    $stmtAlumno->execute();
    $stmtAlumno->close();

    // Inserción en la tabla 'cita' (Únicamente metadatos estrictos de la agenda)
    $queryCita = "INSERT INTO cita (no_control, fecha, hora) VALUES (?, ?, ?)";
    $stmtCita = $conexion->prepare($queryCita);
    $stmtCita->bind_param("sss", $no_control, $fecha, $hora);
    $stmtCita->execute();
    $stmtCita->close();

    // Confirmar cambios y liberar transacciones si ambas operaciones fueron exitosas
    $conexion->commit();

    // --- DISPARO DEL CORREO DE CONFIRMACIÓN EN TIEMPO REAL ---
    // Se ejecuta inmediatamente tras el commit para no demorar los locks de las tablas si el SMTP demora en responder
    $correoEnviado = enviarCorreoConfirmacion($correo, $nombre, $fecha, $hora, $opcion_titulacion);

    echo json_encode([
        "status" => "ok",
        "msg" => "¡Cita registrada con éxito!",
        "mail_status" => $correoEnviado ? "enviado" : "fallo"
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // Deshacer cualquier cambio parcial si la BD arroja algún fallo inesperado
    $conexion->rollback();

    echo json_encode([
        "status" => "error",
        "msg" => "Fallo en el registro: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

/*
=========================================================================
  8. CIERRE DE CONEXIÓN
=========================================================================
*/
$conexion->close();
exit;
?>