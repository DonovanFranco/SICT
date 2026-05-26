<?php
$conexion = new mysqli("localhost","root","","sict_pruebas");

$result = $conexion->query("SELECT * FROM rangos_citas");

$data = [];

while($row = $result->fetch_assoc()){
    $data[] = $row;
}

echo json_encode($data);
?>