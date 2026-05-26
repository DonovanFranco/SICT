<?php
header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$user = "root";
$pass = "";
$db   = "sict_pruebas";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(["status"=>"error","msg"=>"Error de conexión"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$no_control = trim($input["no_control"] ?? "");
$codigo     = trim($input["codigo"] ?? "");

if (!$no_control || !$codigo) {
    echo json_encode(["status"=>"error","msg"=>"Datos incompletos"]);
    exit;
}

$sql = "SELECT codigo_acceso FROM alumno WHERE no_control = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["status"=>"error","msg"=>"Error prepare"]);
    exit;
}

$stmt->bind_param("s", $no_control);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status"=>"error","msg"=>"Alumno no encontrado"]);
    exit;
}

$row = $result->fetch_assoc();

if (!password_verify($codigo, $row["codigo_acceso"])) {
    echo json_encode(["status"=>"error","msg"=>"Código incorrecto"]);
    exit;
}

echo json_encode(["status"=>"ok","msg"=>"Login correcto"]);
exit;