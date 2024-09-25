// Manejador para subir archivos de audio
document.getElementById('uploadForm').onsubmit = function(event) {
    event.preventDefault();  // Evita el comportamiento predeterminado del formulario
    const formData = new FormData(this);  // Recoge los datos del formulario

    // Mostrar el mensaje de procesamiento
    document.getElementById('processingStatus').style.display = 'block';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/', true);  // Realiza una solicitud POST a la ruta del servidor

    xhr.onload = function() {
        document.getElementById('processingStatus').style.display = 'none';  // Oculta el mensaje de procesamiento

        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            document.getElementById('texto_en_espanol').textContent = response.texto_en_espanol || 'No se pudo transcribir el audio.';
            document.getElementById('traduccion').textContent = response.traduccion || 'No se pudo traducir el texto.';
        } else {
            console.error('Error en la solicitud: ' + xhr.status);
            alert('Error al procesar la solicitud. Inténtalo nuevamente.');
        }
    };

    xhr.onerror = function() {
        document.getElementById('processingStatus').style.display = 'none';  // Oculta el mensaje de procesamiento en caso de error
        console.error('Error de red o conexión.');
        alert('Error de red. Verifica tu conexión e inténtalo de nuevo.');
    };

    // Imprimir el contenido de FormData para depuración
    for (var pair of formData.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
    }

    xhr.send(formData);  // Envía los datos del formulario al servidor
};

