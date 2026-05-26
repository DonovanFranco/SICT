<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Como ya usas dompdf, esta ruta apunta exactamente al mismo autoload que ya tienes trabajando
require __DIR__ . '/../vendor/autoload.php';

function enviarCorreoConfirmacion($correoDestino, $nombreAlumno, $fecha, $hora, $opcionTitulacion) {
    $mail = new PHPMailer(true);

    try {
        // --- CONFIGURACIÓN DEL SERVIDOR SMTP ---
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';                     
        $mail->SMTPAuth   = true;
        $mail->Username   = 'dazhfranco@gmail.com';   // Escribe tu correo emisor aquí
        $mail->Password   = 'buvy tgdn owwf aupt';                // Pega tus 16 caracteres de Google aquí (sin espacios)
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;       
        $mail->Port       = 587;                                  
        $mail->CharSet    = 'UTF-8';                              

        // --- DESTINATARIO DINÁMICO ---
        $mail->setFrom('tu_correo_institucional@gmail.com', 'SICT - Departamento de Titulaciones');
        $mail->addAddress($correoDestino, $nombreAlumno);

        // --- FORMATO DE VARIABLES ---
        $fechaFormateada = date("d/m/Y", strtotime($fecha));
        $horaFormateada = date("h:i A", strtotime($hora));

        // --- CUERPO DEL MENSAJE (DISEÑO HTML) ---
        $mail->isHTML(true);
        $mail->Subject = 'Confirmación de tu Cita de Titulación - SICT';
        
        $mail->Body = "
        <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 8px;'>
            <div style='text-align: center; margin-bottom: 20px;'>
                <h2 style='color: #0d6efd; margin: 0;'>¡Cita Registrada Exitosamente!</h2>
                <p style='color: #64748b; font-size: 14px;'>Sistema Integral de Citas para Titulación</p>
            </div>
            <p>Estimado/a <strong>{$nombreAlumno}</strong>,</p>
            <p>Tu registro se ha completado correctamente en nuestra plataforma. A continuación, te compartimos los detalles de tu cita de atención:</p>
            
            <div style='background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;'>
                <table style='width: 100%; font-size: 15px;'>
                    <tr>
                        <td style='padding: 5px 0; color: #475569;'><strong>Trámite / Opción:</strong></td>
                        <td style='padding: 5px 0;'>{$opcionTitulacion}</td>
                    </tr>
                    <tr>
                        <td style='padding: 5px 0; color: #475569;'><strong>Fecha:</strong></td>
                        <td style='padding: 5px 0;'>{$fechaFormateada}</td>
                    </tr>
                    <tr>
                        <td style='padding: 5px 0; color: #475569;'><strong>Horario asignado:</strong></td>
                        <td style='padding: 5px 0;'>{$horaFormateada}</td>
                    </tr>
                </table>
            </div>

            <p style='font-size: 13px; color: #64748b; line-height: 1.5;'>
                * Recuerda presentarte puntualmente en el departamento correspondiente con tu documentación física.<br>
                * Para modificar o cancelar tu cita, ponte en contacto con las autoridades correspondientes.
            </p>
            <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;'>
            <p style='text-align: center; color: #94a3b8; font-size: 12px;'>Tecnológico Nacional de México - Campus Pachuca</p>
        </div>
        ";

        $mail->send();
        return true;
    } catch (Exception $e) {
        return false;
    }
}

// --- FUNCIÓN RECUPERACIÓN (CORREGIDA Y COMPLETA) ---
function enviarCorreoRecuperacion($correo, $nombre, $control, $pass) {
    $mail = new PHPMailer(true);
    try {
        // Configuración SMTP completa
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'dazhfranco@gmail.com';
        $mail->Password   = 'buvy tgdn owwf aupt';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom('dazhfranco@gmail.com', 'SICT - Soporte');
        $mail->addAddress($correo, $nombre);
        
        $mail->isHTML(true);
        $mail->Subject = 'Recuperación de acceso al SICT';
        $mail->Body = "
            <div style='font-family: sans-serif; padding: 20px;'>
                <h2>Recuperación de Contraseña</h2>
                <p>Hola <strong>{$nombre}</strong>,</p>
                <p>Has solicitado recuperar tu acceso. Aquí tienes tus credenciales:</p>
                <ul>
                    <li><strong>Número de Control:</strong> {$control}</li>
                    <li><strong>Nueva Contraseña Temporal:</strong> {$pass}</li>
                </ul>
                <p>Te recomendamos cambiar esta contraseña al ingresar.</p>
            </div>";
            
        $mail->send();
        return true;
    } catch (Exception $e) {
        return $mail->ErrorInfo; // Esto devolverá el error real si algo falla
    }}