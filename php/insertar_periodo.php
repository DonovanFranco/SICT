<?php

$data = json_decode(file_get_contents("php://input"), true);

$inicio = $data['fecha_inicio'];
$fin = $data['fecha_fin'];

$conexion = new mysqli("localhost","root","","sict_pruebas");

// 🚫 Validar fechas pasadas
$hoy = date("Y-m-d");

if($inicio < $hoy || $fin < $hoy){
    echo json_encode(["ok"=>false,"mensaje"=>"Fechas no válidas"]);
    exit;
}

// 🚫 Validar empalmes
$sql = "SELECT * FROM rangos_citas
WHERE NOT ('$fin' < fecha_inicio OR '$inicio' > fecha_fin)";

$result = $conexion->query($sql);

if($result->num_rows > 0){
    echo json_encode(["ok"=>false,"mensaje"=>"El periodo se empalma"]);
    exit;
}

// ✅ Insertar
$sqlInsert = "INSERT INTO rangos_citas (fecha_inicio, fecha_fin, activo)
VALUES ('$inicio','$fin',0)";

$conexion->query($sqlInsert);

echo json_encode(["ok"=>true]);

?>