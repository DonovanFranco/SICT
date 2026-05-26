<?php

header('Content-Type: application/json');

$conn = new mysqli("localhost","root","","sict_pruebas");

if($conn->connect_error){
    echo json_encode([]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$no_control = $data['no_control'] ?? '';

if(!$no_control){
    echo json_encode([]);
    exit;
}

$sql = "
SELECT
    id_cita,
    fecha,
    hora,
    estatus,
    observaciones,
    carpeta_generada
FROM cita
WHERE no_control = ?
ORDER BY fecha DESC, hora DESC
";

$stmt = $conn->prepare($sql);

$stmt->bind_param("s", $no_control);

$stmt->execute();

$result = $stmt->get_result();

$citas = [];

while($row = $result->fetch_assoc()){

    $citas[] = $row;
}

echo json_encode($citas);

$stmt->close();
$conn->close();

?>