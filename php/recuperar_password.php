<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'mailer_config.php'; 

$conexion = new mysqli("localhost", "root", "", "sict_pruebas");

$input = json_decode(file_get_contents("php://input"), true);
$correo_input = trim($input["correo"] ?? "");

// 1. Validar presencia
if (empty($correo_input)) {
    echo json_encode(["status" => "error", "msg" => "Correo no proporcionado"]);
    exit;
}

// 2. Buscar alumno
$stmt = $conexion->prepare("SELECT no_control, nombre FROM alumno WHERE correo = ?");
$stmt->bind_param("s", $correo_input);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "msg" => "El correo no está registrado."]);
    exit;
}

$alumno = $result->fetch_assoc();
$no_control = $alumno["no_control"];

// 3. Generar nueva pass
$nuevaPass = substr(str_shuffle("ABCDEFGHJKLMNPQRSTUVWXYZ23456789"), 0, 8);
$hash = password_hash($nuevaPass, PASSWORD_BCRYPT);

// 4. Actualizar BD
$update = $conexion->prepare("UPDATE alumno SET codigo_acceso = ? WHERE no_control = ?");
$update->bind_param("ss", $hash, $no_control);

if ($update->execute()) {
    
    // --- ENVÍO DE CORREO ---
    // Usamos $correo_input directamente para garantizar que la variable existe
    $res = enviarCorreoRecuperacion($correo_input, $alumno["nombre"], $no_control, $nuevaPass);
    
    if ($res === true) {
        echo json_encode(["status" => "ok", "msg" => "Credenciales enviadas a tu correo."]);
    } else {
        // Si falla, imprimimos el error de PHPMailer aquí mismo
        echo json_encode(["status" => "error", "msg" => $res]);
    }
} else {
    echo json_encode(["status" => "error", "msg" => "Error al actualizar contraseña."]);
}

$conexion->close();
?>