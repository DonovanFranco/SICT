<?php

header('Content-Type: application/json');

$conexion = new mysqli("localhost","root","","sict_pruebas");

if($conexion->connect_error){
    echo json_encode(["ok"=>false]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$id_cita = $data['id_cita'] ?? 0;

$sql = "UPDATE cita
        SET carpeta_generada = 1,
            fecha_generacion = NOW()
        WHERE id_cita = ?";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id_cita);

if($stmt->execute()){

    echo json_encode([
        "ok"=>true
    ]);

}else{

    echo json_encode([
        "ok"=>false
    ]);
}
?>