<?php

header('Content-Type: application/json');

$conexion = new mysqli("localhost","root","","sict_pruebas");

if($conexion->connect_error){
    echo json_encode(["ok"=>false, "error"=>"conexion"]);
    exit;
}

// Leer JSON
$data = json_decode(file_get_contents("php://input"), true);

if(!$data){
    echo json_encode(["ok"=>false, "error"=>"sin datos"]);
    exit;
}

// 🔹 CAMPOS
$no_control = $data['no_control'] ?? '';

if(!$no_control){
    echo json_encode(["ok"=>false, "error"=>"no_control requerido"]);
    exit;
}

// Campos editables
$nombre = $data['nombre'] ?? '';
$carrera = $data['carrera'] ?? '';
$correo = $data['correo'] ?? '';
$telefono = $data['telefono'] ?? '';
$opcion = $data['opcion_titulacion'] ?? '';
$tipo = $data['tipo_integral'] ?? null;
$integrantes = $data['num_integrantes'] ?? 0;
$notas = $data['notas'] ?? null;

// 🔴 Si no es Titulación Integral, limpiar tipo_integral
if($opcion !== "Titulacion Integral"){
    $tipo = null;
}

// 🔧 QUERY PREPARADA
$sql = "UPDATE alumno SET 
    nombre = ?,
    carrera = ?,
    correo = ?,
    telefono = ?,
    opcion_titulacion = ?,
    tipo_integral = ?,
    num_integrantes = ?,
    notas = ?
WHERE no_control = ?";

$stmt = $conexion->prepare($sql);

if(!$stmt){
    echo json_encode(["ok"=>false, "error"=>$conexion->error]);
    exit;
}

$stmt->bind_param(
    "ssssssiss",
    $nombre,
    $carrera,
    $correo,
    $telefono,
    $opcion,
    $tipo,
    $integrantes,
    $notas,
    $no_control
);

if($stmt->execute()){
    echo json_encode(["ok"=>true]);
}else{
    echo json_encode(["ok"=>false, "error"=>$stmt->error]);
}

$stmt->close();
$conexion->close();
?>