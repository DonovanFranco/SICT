<?php

header('Content-Type: application/json');

$conn = new mysqli(
    "localhost",
    "root",
    "",
    "sict_pruebas"
);

if($conn->connect_error){
    echo json_encode([]);
    exit;
}

$data = json_decode(
    file_get_contents("php://input"),
    true
);

$no_control = $data["no_control"] ?? "";

if(!$no_control){
    echo json_encode([]);
    exit;
}

$sql = "SELECT
            c.id_cita,
            c.fecha,
            c.hora,
            c.estatus,        -- Usas 'estatus' en la BD
            c.observaciones,
            c.carpeta_generada,

            a.no_control,
            a.nombre,
            a.curp,
            a.carrera,
            a.correo,
            a.telefono,
            a.opcion_titulacion,
            a.tipo_integral,
            a.notas           -- 🔹 Agregamos el campo notas de la tabla alumno

        FROM cita c

        INNER JOIN alumno a
        ON c.no_control = a.no_control

        WHERE c.no_control = ?

        ORDER BY c.fecha DESC, c.hora DESC";

$stmt = $conn->prepare($sql);

if(!$stmt){
    echo json_encode([
        "error" => $conn->error
    ]);
    exit;
}

$stmt->bind_param("s",$no_control);

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