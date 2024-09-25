// Manejador para grabación de audio en tiempo real
const startRecordBtn = document.getElementById('start-record-btn');
const stopRecordBtn = document.getElementById('stop-record-btn');
const recordingStatus = document.getElementById('recordingStatus');
let mediaRecorder;
let audioChunks = [];

startRecordBtn.addEventListener('click', startRecording);
stopRecordBtn.addEventListener('click', stopRecording);

function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('La grabación de audio no es compatible con tu navegador.');
        return;
    }

    startRecordBtn.style.display = 'none';
    stopRecordBtn.style.display = 'inline';

    // Mostrar el mensaje de "Grabando..."
    recordingStatus.style.display = 'block';

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(stream) {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            audioChunks = [];  // Resetea los fragmentos de audio

            mediaRecorder.ondataavailable = function(event) {
                audioChunks.push(event.data);  // Añade los datos de audio grabados
            };

            mediaRecorder.onstop = function() {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });  // Graba en webm
                convertToWav(audioBlob).then(function(wavBlob) {
                    sendAudioForTranscription(wavBlob);  // Envía el audio convertido a WAV para su transcripción
                });
                recordingStatus.style.display = 'none';  // Oculta el mensaje de grabación cuando se detiene
            };
        })
        .catch(function(error) {
            console.error('Error al acceder al micrófono: ', error);
            alert('No se puede acceder al micrófono. Verifica los permisos de acceso.');
        });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();  // Detiene la grabación
    }
    startRecordBtn.style.display = 'inline';
    stopRecordBtn.style.display = 'none';

    // Cambiar el mensaje de grabación cuando se detiene
    setTimeout(() => {
        recordingStatus.style.display = 'none';  // Oculta el mensaje después de un breve periodo
    }, 2000);
}

// Convierte el audio grabado a formato WAV
async function convertToWav(audioBlob) {
    const arrayBuffer = await audioBlob.arrayBuffer();  // Convierte el Blob a ArrayBuffer
    const wav = new wavefile.WaveFile();  // Crea una nueva instancia de WaveFile

    // Crea el archivo WAV desde un ArrayBuffer (estéreo, 44100 Hz, 16 bits)
    wav.fromScratch(1, 44100, '16', new Uint8Array(arrayBuffer));

    // Genera un Blob en formato WAV
    return new Blob([wav.toBuffer()], { type: 'audio/wav' });
}

// Envía el audio grabado para su transcripción y traducción
function sendAudioForTranscription(audioBlob) {
    const formData = new FormData();

    // Validación del idioma destino
    const idiomaDestino = document.getElementById('idioma_destino_grabado').value;
    if (!idiomaDestino) {
        alert('Por favor selecciona un idioma de destino.');
        return;
    }

    // Crear el archivo WAV con la extensión .wav
    const wavFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

    formData.append('audio_file', wavFile);
    formData.append('idioma_destino', idiomaDestino);

    // Imprimir el contenido de FormData para depuración
    for (var pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    // Mostrar el mensaje de "Procesando..."
    document.getElementById('processingStatus').style.display = 'block';

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/', true);  // Realiza la solicitud POST al servidor

    xhr.onload = function() {
        document.getElementById('processingStatus').style.display = 'none';  // Oculta el mensaje de procesamiento cuando finaliza

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

    xhr.send(formData);  // Envía el audio grabado y el idioma de destino
}
