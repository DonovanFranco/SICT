<?php
header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$user = "root";
$pass = "";
$db   = "sict_pruebas";

$conn = new mysqli($host,$user,$pass,$db);

if($conn->connect_error){
    echo json_encode(["status"=>"error","msg"=>"Error de conexión"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$usuario = trim($input["usuario"] ?? "");
$codigo  = trim($input["codigo"] ?? "");

if(!$usuario || !$codigo){
    echo json_encode(["status"=>"error","msg"=>"Datos incompletos"]);
    exit;
}

$sql = "SELECT nombre, password FROM admin WHERE usuario = ?";
$stmt = $conn->prepare($sql);

$stmt->bind_param("s",$usuario);
$stmt->execute();
$result = $stmt->get_result();

if($result->num_rows === 0){
    echo json_encode(["status"=>"error","msg"=>"Usuario no encontrado"]);
    exit;
}

$row = $result->fetch_assoc();

if(!password_verify($codigo,$row["password"])){
    echo json_encode(["status"=>"error","msg"=>"Contraseña incorrecta"]);
    exit;
}

echo json_encode([
    "status"=>"ok",
    "msg"=>"Login correcto",
    "nombre"=>$row["nombre"]
]);

exit;
?>