<?php
header('Content-Type: application/json');

// Conexión
$conn = new mysqli("localhost", "root", "", "sict_pruebas");

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

$fecha = $_GET['fecha'] ?? '';

if (!$fecha) {
    echo json_encode([]);
    exit;
}

/*
⚠ IMPORTANTE:
Solo traer citas ACTIVAS
*/
$sql = "SELECT hora 
        FROM citas 
        WHERE fecha = ? 
        AND estatus = 'Activa'";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $fecha);
$stmt->execute();
$result = $stmt->get_result();

$horarios = [];

while ($row = $result->fetch_assoc()) {
    // Asegurarnos de devolver HH:MM
    $horarios[] = substr($row['hora'], 0, 5);
}

echo json_encode($horarios);

$stmt->close();
$conn->close();
?>