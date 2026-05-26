<?php

error_reporting(E_ALL);
ini_set('display_errors',1);

header('Content-Type: application/json');

$conn = new mysqli("localhost","root","","sict_pruebas");

if($conn->connect_error){
    echo json_encode([
        "valido"=>false,
        "error"=>$conn->connect_error
    ]);
    exit;
}

$fecha = $_GET['fecha'] ?? '';

if(empty($fecha)){
    echo json_encode([
        "valido"=>false,
        "error"=>"Fecha vacía"
    ]);
    exit;
}

/*
=====================================
1. PERIODO ACTIVO
=====================================
*/

$sqlPeriodo = "SELECT * FROM rangos_citas 
               WHERE activo = 1 
               LIMIT 1";

$resPeriodo = $conn->query($sqlPeriodo);

if(!$resPeriodo){
    echo json_encode([
        "valido"=>false,
        "error"=>$conn->error
    ]);
    exit;
}

$periodo = $resPeriodo->fetch_assoc();

if(!$periodo){
    echo json_encode([
        "valido"=>false,
        "error"=>"No existe periodo activo"
    ]);
    exit;
}

if(!isset($periodo['id'])){
    echo json_encode([
        "valido"=>false,
        "error"=>"El campo id no existe en rangos_citas"
    ]);
    exit;
}

if(
    $fecha < $periodo['fecha_inicio'] ||
    $fecha > $periodo['fecha_fin']
){
    echo json_encode([
        "valido"=>false,
        "error"=>"Fecha fuera del periodo"
    ]);
    exit;
}

/*
=====================================
2. DIA BLOQUEADO
=====================================
*/

$sqlBloq = "SELECT 1 
            FROM dias_bloqueados 
            WHERE fecha = ?";

$stmt = $conn->prepare($sqlBloq);

if(!$stmt){
    echo json_encode([
        "valido"=>false,
        "error"=>$conn->error
    ]);
    exit;
}

$stmt->bind_param("s",$fecha);
$stmt->execute();

$resBloq = $stmt->get_result();

if($resBloq->num_rows > 0){

    echo json_encode([
        "valido"=>false,
        "bloqueado"=>true
    ]);

    $stmt->close();
    exit;
}

$stmt->close();

/*
=====================================
3. GENERAR HORARIOS
=====================================
*/

$sqlAgenda = "SELECT hora_inicio, hora_fin
              FROM agendas
              WHERE id_periodo = ?";

$stmt = $conn->prepare($sqlAgenda);

if(!$stmt){
    echo json_encode([
        "valido"=>false,
        "error"=>$conn->error
    ]);
    exit;
}

$stmt->bind_param("i",$periodo['id']);
$stmt->execute();

$resAgenda = $stmt->get_result();

$horarios = [];

while($a = $resAgenda->fetch_assoc()){

    if(
        empty($a['hora_inicio']) ||
        empty($a['hora_fin'])
    ){
        continue;
    }

    list($h1,$m1) = explode(":",substr($a['hora_inicio'],0,5));
    list($h2,$m2) = explode(":",substr($a['hora_fin'],0,5));

    $inicio = ($h1*60)+$m1;
    $fin = ($h2*60)+$m2;

    while($inicio < $fin){

        $hora = floor($inicio/60);
        $min = $inicio%60;

        $horaFormateada =
            str_pad($hora,2,"0",STR_PAD_LEFT)
            .":"
            .
            str_pad($min,2,"0",STR_PAD_LEFT);

        if(!in_array($horaFormateada,$horarios)){
            $horarios[] = $horaFormateada;
        }

        $inicio += 30;
    }
}

$stmt->close();

/*
=====================================
SIN HORARIOS CONFIGURADOS
=====================================
*/

if(empty($horarios)){

    echo json_encode([
        "valido"=>true,
        "horarios"=>[],
        "debug"=>"No hay agendas configuradas"
    ]);

    exit;
}

/*
=====================================
4. CITAS OCUPADAS
=====================================
*/

$sqlCitas = "SELECT hora
             FROM cita
             WHERE fecha = ?
             AND estatus != 'Rechazado'";

$stmt = $conn->prepare($sqlCitas);

if(!$stmt){
    echo json_encode([
        "valido"=>false,
        "error"=>$conn->error
    ]);
    exit;
}

$stmt->bind_param("s",$fecha);
$stmt->execute();

$resCitas = $stmt->get_result();

$ocupados = [];

while($c = $resCitas->fetch_assoc()){

    if(!empty($c['hora'])){
        $ocupados[] = substr($c['hora'],0,5);
    }
}

$stmt->close();

/*
=====================================
5. DISPONIBLES
=====================================
*/

$disponibles = array_values(
    array_diff($horarios,$ocupados)
);

sort($disponibles);

/*
=====================================
RESPUESTA FINAL
=====================================
*/

echo json_encode([
    "valido"=>true,
    "horarios"=>$disponibles
]);

$conn->close();

?>