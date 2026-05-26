<?php

header('Content-Type: application/json');

$conn = new mysqli("localhost", "root", "", "sict_pruebas");

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$no_control = $data['no_control'] ?? '';

if (!$no_control) {
    echo json_encode([]);
    exit;
}

// 🔥 TRAER TODO
$sql = "SELECT * FROM alumno WHERE no_control = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $no_control);
$stmt->execute();

$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode($row);
} else {
    echo json_encode([]);
}

$stmt->close();
$conn->close();