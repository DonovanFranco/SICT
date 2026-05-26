<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json; charset=utf-8');

/* =========================
   CONEXIÓN BD
========================= */
$host = "localhost";
$user = "root";
$pass = "";
$db   = "sict_pruebas";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "msg" => "Error de conexión a BD"
    ]);
    exit;
}

/* =========================
   OBTENER DATOS POST
========================= */
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode([
        "status" => "error",
        "msg" => "No se recibieron datos"
    ]);
    exit;
}

$no_control        = trim($input["no_control"]);
$nombre            = trim($input["nombre"]);
$carrera           = trim($input["carrera"]);
$correo            = trim($input["correo"]);
$telefono          = trim($input["telefono"]);
$codigo_acceso     = password_hash($input["codigo_acceso"], PASSWORD_DEFAULT);
$opcion_titulacion = trim($input["opcion_titulacion"]);
$tipo_integral     = trim($input["tipo_integral"]);
$num_integrantes   = intval($input["num_integrantes"]);
$observaciones     = trim($input["observaciones"]);
$fecha             = trim($input["fecha"]);
$hora              = trim($input["hora"]);

/* =========================
   VALIDAR DUPLICADOS ALUMNO
========================= */
$sql = "SELECT no_control FROM alumno 
        WHERE no_control = ? 
        OR correo = ? 
        OR telefono = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $no_control, $correo, $telefono);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "status" => "error",
        "msg" => "El número de control, correo o teléfono ya están registrados"
    ]);
    exit;
}

/* =========================
   VALIDAR HORARIO OCUPADO
========================= */
$sql = "SELECT id_cita FROM cita WHERE fecha = ? AND hora = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $fecha, $hora);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "status" => "error",
        "msg" => "El horario seleccionado ya está ocupado"
    ]);
    exit;
}

/* =========================
   INSERTAR ALUMNO
========================= */
$sql = "INSERT INTO alumno 
(no_control, nombre, carrera, correo, telefono, codigo_acceso,
 opcion_titulacion, tipo_integral, num_integrantes, observaciones)
VALUES (?,?,?,?,?,?,?,?,?,?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param(
    "ssssssssss",
    $no_control,
    $nombre,
    $carrera,
    $correo,
    $telefono,
    $codigo_acceso,
    $opcion_titulacion,
    $tipo_integral,
    $num_integrantes,
    $observaciones
);

if (!$stmt->execute()) {
    echo json_encode([
        "status" => "error",
        "msg" => "Error al registrar alumno: " . $stmt->error
    ]);
    exit;
}

/* =========================
   INSERTAR CITA
========================= */
$sql = "INSERT INTO cita (no_control, fecha, hora)
        VALUES (?,?,?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $no_control, $fecha, $hora);

if (!$stmt->execute()) {
    echo json_encode([
        "status" => "error",
        "msg" => "Error al registrar cita: " . $stmt->error
    ]);
    exit;
}

/* =========================
   RESPUESTA OK
========================= */
echo json_encode([
    "status" => "ok",
    "msg" => "Cita y cuenta registradas correctamente"
]);
exit;
