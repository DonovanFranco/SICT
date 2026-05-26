<?php

header('Content-Type: application/json');

$conexion = new mysqli("localhost","root","","sict_pruebas");

if($conexion->connect_error){
    echo json_encode(["ok"=>false]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

$data = json_decode(file_get_contents("php://input"), true);

switch($method){

    // 🔍 OBTENER
    case "GET":

        $result = $conexion->query("SELECT * FROM dias_bloqueados ORDER BY fecha");

        $rows = [];

        while($r = $result->fetch_assoc()){
            $rows[] = $r;
        }

        echo json_encode($rows);
    break;


    // ➕ INSERTAR
    case "POST":

        $fecha = $data['fecha'];
        $motivo = $data['motivo'] ?? '';

        $sql = "INSERT INTO dias_bloqueados (fecha, motivo)
                VALUES ('$fecha','$motivo')";

        if($conexion->query($sql)){
            echo json_encode(["ok"=>true]);
        }else{
            echo json_encode(["ok"=>false,"error"=>$conexion->error]);
        }

    break;


    // ❌ ELIMINAR
    case "DELETE":

        $id = $data['id'];

        $conexion->query("DELETE FROM dias_bloqueados WHERE id = $id");

        echo json_encode(["ok"=>true]);

    break;
}
?>