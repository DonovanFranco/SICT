<?php

// 🔥 LIMPIAR CUALQUIER SALIDA PREVIA
while (ob_get_level()) {
    ob_end_clean();
}
ob_start();

// 🔕 DESACTIVAR ERRORES EN PANTALLA
error_reporting(0);
ini_set('display_errors', 0);

require __DIR__ . '/../vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

// =========================
// CONEXIÓN
// =========================
$conn = new mysqli("localhost", "root", "", "sict_pruebas");

if ($conn->connect_error) {
    die("Error de conexión");
}

// =========================
// OBTENER FECHA
// =========================
$fecha = $_GET['fecha'] ?? '';

if (!$fecha) {
    die("Fecha no válida");
}

// =========================
// CONSULTA (INCLUYENDO NOTAS Y OBSERVACIONES)
// =========================
$sql = "SELECT 
    c.fecha,
    c.hora,
    a.notas,
    c.observaciones,
    IFNULL(c.estatus,'Pendiente') AS estado,
    a.no_control,
    a.nombre,
    a.correo,
    a.telefono,
    a.opcion_titulacion,
    a.carrera
FROM cita c
LEFT JOIN alumno a ON c.no_control = a.no_control
WHERE DATE(c.fecha) = ?
ORDER BY c.hora ASC";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    die("Error en SQL: " . $conn->error);
}

$stmt->bind_param("s", $fecha);

if (!$stmt->execute()) {
    die("Error al ejecutar: " . $stmt->error);
}

$result = $stmt->get_result();

// =========================
// HTML DEL PDF
// =========================
$html = "
<style>
body {
    font-family: Arial, sans-serif;
    color: #333;
}

.header {
    text-align: center;
    margin-bottom: 10px;
}

.header h2 {
    margin: 0;
    color: #351D6C;
}

.header p {
    margin: 5px 0;
    font-size: 14px;
}

table {
    border-collapse: collapse;
    width: 100%;
    margin-top: 10px;
}

th {
    background-color: #351D6C;
    color: white;
    padding: 8px;
    font-size: 12px;
}

td {
    border: 1px solid #ccc;
    padding: 6px;
    font-size: 11px;
}

.text-center {
    text-align: center;
}

.label-row {
    text-align: left;
    font-weight: bold;
    width: 120px;
}

.footer {
    margin-top: 15px;
    font-size: 10px;
    text-align: right;
    color: #555;
}
</style>

<div class='header'>
    <h2>SICT - Tecnológico Nacional de México</h2>
    <p><strong>Agenda de Citas</strong></p>
    <p><strong>Fecha:</strong> $fecha</p>
</div>

<table>
<tr>
    <th>Hora</th>
    <th>No. Control</th>
    <th>Nombre</th>
    <th>Correo</th>
    <th>Teléfono</th>
    <th>Opcion Titulacion</th>
    <th>Carrera</th>
</tr>
";

// =========================
// DATOS (ESTRUCTURA DE TRIPLE FILA DINÁMICA)
// =========================
if ($result->num_rows > 0) {

    while ($row = $result->fetch_assoc()) {

        // Fila 1: Datos generales del alumno
        $html .= "<tr>
            <td class='text-center'><strong>{$row['hora']}</strong></td>
            <td class='text-center'>{$row['no_control']}</td>
            <td class='text-center'>{$row['nombre']}</td>
            <td class='text-center'>{$row['correo']}</td>
            <td class='text-center'>{$row['telefono']}</td>
            <td class='text-center'>{$row['opcion_titulacion']}</td>
            <td class='text-center'>{$row['carrera']}</td>
        </tr>";

        // Fila 2: Notas traídas de la base de datos
        $html .= "<tr>
            <td class='label-row'>Notas:</td>
            <td colspan='5'>{$row['notas']}</td>
        </tr>";

        // Fila 3: Observaciones traídas de la base de datos
        $html .= "<tr>
            <td class='label-row'>Observaciones:</td>
            <td colspan='5'>{$row['observaciones']}</td>
        </tr>";
    }

} else {

    $html .= "<tr>
        <td colspan='6' class='text-center'>No hay citas registradas</td>
    </tr>";
}

$html .= "
</table>

<div class='footer'>
Documento generado automáticamente por el sistema SICT
</div>
";

// =========================
// GENERAR PDF CON DOMPDF
// =========================
$options = new Options();
$options->set('isRemoteEnabled', true);

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

// 🔥 LIMPIAR BUFFER FINAL PARA EVITAR CORRUPCIÓN
while (ob_get_level()) {
    ob_end_clean();
}

// CONFIGURACIÓN DE SALIDA
header("Content-Type: application/pdf");
header("Content-Disposition: inline; filename=agenda_$fecha.pdf");

// MOSTRAR PDF
echo $dompdf->output();
exit;