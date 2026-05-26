<?php

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'];

$conexion = new mysqli("localhost","root","","sict_pruebas");

// opcional: evitar borrar activo
$check = $conexion->query("SELECT activo FROM rangos_citas WHERE id = $id");
$row = $check->fetch_assoc();

if($row['activo'] == 1){
    echo json_encode(["ok"=>false,"mensaje"=>"No puedes eliminar el activo"]);
    exit;
}

$conexion->query("DELETE FROM rangos_citas WHERE id = $id");

echo json_encode(["ok"=>true]);

?>