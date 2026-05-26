<?php

header('Content-Type: application/json; charset=utf-8');

$conexion = new mysqli("localhost","root","","sict_pruebas");

if($conexion->connect_error){
    echo json_encode([]);
    exit;
}

$sql = "SELECT 
c.id_cita,
a.no_control,
a.curp,
a.nombre,
c.fecha,
c.hora,
c.carpeta_generada,
c.estatus AS estado,
a.telefono,
a.correo,
c.observaciones,
a.carrera,
a.opcion_titulacion,
a.tipo_integral
FROM cita c
INNER JOIN alumno a 
ON c.no_control = a.no_control
ORDER BY c.fecha, c.hora";

$result = $conexion->query($sql);

$citas = [];

while($row = $result->fetch_assoc()){
$citas[] = $row;
}

echo json_encode($citas);

?>