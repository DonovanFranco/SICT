<?php
header('Content-Type: application/json');

$conn = new mysqli("localhost","root","","sict_pruebas");

if($conn->connect_error){
    echo json_encode(["ok"=>false,"error"=>"conexion"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$no_control = $data['no_control'] ?? '';
$fecha      = $data['fecha'] ?? '';
$hora       = $data['hora'] ?? '';

if(!$no_control || !$fecha || !$hora){
    echo json_encode(["ok"=>false,"error"=>"datos incompletos"]);
    exit;
}

/*
========================================
🔒 VALIDACIÓN: HORARIO OCUPADO
========================================
*/
$sqlCheck = "SELECT id_cita 
             FROM cita 
             WHERE fecha = ? 
             AND hora = ? 
             AND estatus IN ('Pendiente','Aceptado')";

$stmtCheck = $conn->prepare($sqlCheck);
$stmtCheck->bind_param("ss", $fecha, $hora);
$stmtCheck->execute();
$res = $stmtCheck->get_result();

if($res->num_rows > 0){
    echo json_encode([
        "ok"=>false,
        "error"=>"Horario ocupado"
    ]);
    $stmtCheck->close();
    $conn->close();
    exit;
}

$stmtCheck->close();

/*
========================================
🔒 TRANSACCIÓN
========================================
*/
$conn->begin_transaction();

try{

    /*
    🔴 1. CANCELAR CITAS ACTIVAS
    */
    $sql1 = "UPDATE cita 
             SET estatus = 'Rechazado'
             WHERE no_control = ?
             AND estatus IN ('Pendiente','Aceptado')";

    $stmt1 = $conn->prepare($sql1);
    $stmt1->bind_param("s", $no_control);
    $stmt1->execute();


    /*
    🟢 2. INSERTAR NUEVA CITA
    */
    $sql2 = "INSERT INTO cita (no_control, fecha, hora, estatus)
             VALUES (?, ?, ?, 'Pendiente')";

    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param("sss", $no_control, $fecha, $hora);
    $stmt2->execute();


    /*
    ✅ CONFIRMAR
    */
    $conn->commit();

    echo json_encode(["ok"=>true]);

}catch(Exception $e){

    $conn->rollback();

    echo json_encode([
        "ok"=>false,
        "error"=>$e->getMessage()
    ]);
}

$stmt1->close();
$stmt2->close();
$conn->close();
?>