<?php

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'];

$conexion = new mysqli("localhost","root","","sict_pruebas");

// 🔥 Desactivar todos
$conexion->query("UPDATE rangos_citas SET activo = 0");

// 🔥 Activar solo uno
$conexion->query("UPDATE rangos_citas SET activo = 1 WHERE id = $id");

echo json_encode(["ok" => true]);

?>