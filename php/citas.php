<?php

header('Content-Type: application/json');

$conexion = new mysqli("localhost","root","","sict_pruebas");

if($conexion->connect_error){
    echo json_encode(["ok"=>false, "error"=>"Error de conexión"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

if(!$data){
    echo json_encode(["ok"=>false, "error"=>"Datos inválidos"]);
    exit;
}

switch($method){

    case "POST":

        if(!isset($data['id'])){
            echo json_encode(["ok"=>false, "error"=>"ID requerido"]);
            exit;
        }

        $id = intval($data['id']);

        // 🔥 ACTUALIZAR ESTATUS
        if(isset($data['estatus'])){

            $estatus = $conexion->real_escape_string($data['estatus']);

            // Validar valores permitidos
            $validos = ["Pendiente", "Aceptado", "Rechazado"];

            if(!in_array($estatus, $validos)){
                echo json_encode(["ok"=>false, "error"=>"Estado inválido"]);
                exit;
            }

            $sql = "UPDATE cita 
                    SET estatus = '$estatus' 
                    WHERE id_cita = $id";
        }

        // 🔥 ACTUALIZAR OBSERVACIONES
        else if(isset($data['observaciones'])){

            $obs = $conexion->real_escape_string($data['observaciones']);

            $sql = "UPDATE cita 
                    SET observaciones = '$obs' 
                    WHERE id_cita = $id";
        }

        else{
            echo json_encode(["ok"=>false, "error"=>"Sin datos para actualizar"]);
            exit;
        }

        // Ejecutar
        if($conexion->query($sql)){
            echo json_encode(["ok"=>true]);
        }else{
            echo json_encode([
                "ok"=>false, 
                "error"=>$conexion->error
            ]);
        }

    break;

    default:
        echo json_encode(["ok"=>false, "error"=>"Método no permitido"]);
    break;
}
?>