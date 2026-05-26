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

        $sql = "SELECT a.*, r.fecha_inicio, r.fecha_fin
                FROM agendas a
                JOIN rangos_citas r ON a.id_periodo = r.id";

        $result = $conexion->query($sql);

        $rows = [];

        while($r = $result->fetch_assoc()){
            $rows[] = $r;
        }

        echo json_encode($rows);

    break;


    // ➕ INSERTAR
    case "POST":

        $id_periodo = $data['id_periodo'];
        $inicio = $data['inicio'];
        $fin = $data['fin'];

        if($fin <= $inicio){
            echo json_encode(["ok"=>false,"error"=>"Horario inválido"]);
            exit;
        }

        $sql = "INSERT INTO agendas (id_periodo, hora_inicio, hora_fin)
                VALUES ($id_periodo,'$inicio','$fin')";

        if($conexion->query($sql)){
            echo json_encode(["ok"=>true]);
        }else{
            echo json_encode(["ok"=>false,"error"=>$conexion->error]);
        }

    break;


    // ❌ ELIMINAR
    case "DELETE":

        $id = $data['id'];

        $conexion->query("DELETE FROM agendas WHERE id = $id");

        echo json_encode(["ok"=>true]);

    break;
}
?>