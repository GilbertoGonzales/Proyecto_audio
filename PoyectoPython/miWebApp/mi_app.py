from flask import Flask, request, jsonify, render_template
import speech_recognition as sr
from deep_translator import GoogleTranslator
import os
import wave  # Para verificar las propiedades del archivo WAV

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def transcribe_and_translate():
    if request.method == 'POST':
        print("Petición POST recibida")

        # Obtener el archivo de audio y verificar que existe
        audio_file = request.files.get('audio_file')
        if not audio_file or audio_file.filename == '':
            print("Error: No se recibió el archivo de audio")
            return jsonify({'error': 'No se recibió el archivo de audio'}), 400

        # Verificar que el archivo sea de un tipo aceptable (WAV)
        if not audio_file.filename.endswith('.wav'):
            print("Error: Formato de archivo no compatible")
            return jsonify({'error': 'Formato de archivo no compatible, se espera un archivo WAV'}), 400

        print(f"Archivo recibido: {audio_file.filename}")

        # Guardar el archivo temporalmente como WAV
        wav_filename = "temp_audio.wav"
        audio_file.save(wav_filename)

        try:
            # Verificar las propiedades del archivo WAV
            try:
                with wave.open(wav_filename, 'rb') as wav_file:
                    print(f"Canales: {wav_file.getnchannels()}")
                    print(f"Frecuencia de muestreo: {wav_file.getframerate()}")
                    print(f"Duración: {wav_file.getnframes() / wav_file.getframerate()} segundos")
            except Exception as e:
                print(f"Error al abrir el archivo WAV: {e}")
                return jsonify({'error': 'El archivo WAV no es válido.'}), 400

            # Transcribir el archivo WAV directamente
            recognizer = sr.Recognizer()
            with sr.AudioFile(wav_filename) as source:
                # Capturar el audio completo
                audio_data = recognizer.record(source)
                print("Audio cargado correctamente para reconocimiento.")

            # Intentar reconocer el texto en español
            texto_en_espanol = recognizer.recognize_google(audio_data, language="es-ES")
            print(f"Texto transcrito: {texto_en_espanol}")

            # Traducir el texto
            idioma_destino = request.form.get('idioma_destino', 'en')
            translator = GoogleTranslator(source='auto', target=idioma_destino)
            traduccion = translator.translate(texto_en_espanol)
            print(f"Texto traducido: {traduccion}")

        except sr.UnknownValueError:
            print("Error: No se pudo reconocer el audio.")
            return jsonify({'error': 'No se pudo reconocer el audio.'}), 500
        except sr.RequestError as e:
            print(f"Error al comunicarse con el servicio de Google: {e}")
            return jsonify({'error': f'Error al comunicarse con el servicio de Google: {str(e)}'}), 500
        except Exception as e:
            print(f"Error procesando el archivo de audio: {e}")
            return jsonify({'error': f'Error al procesar el archivo de audio: {str(e)}'}), 500
        finally:
            if os.path.exists(wav_filename):
                os.remove(wav_filename)

        return jsonify({'texto_en_espanol': texto_en_espanol, 'traduccion': traduccion})

    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)