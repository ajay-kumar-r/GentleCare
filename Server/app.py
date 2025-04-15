#final flask backend. working chat, speak, transcribe

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from pyngrok import ngrok
from google.cloud import speech, texttospeech
import google.generativeai as genai
import os
import io
import wave

app = Flask(__name__)
CORS(app)

# Set Google Cloud credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "gentecare-c5d5a11b6915.json"

# Gemini
API_KEY = "AIzaSyB2PhOsz-fWJIN2VvzTGwQsaG-XsyueRUw"
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-pro-latest")
conversation_history = []

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.get_json().get("message", "")
    conversation_history.append(f"User: {user_input}")
    prompt = (
        "You're a gentle, supportive chatbot for elderly users. "
        "Respond warmly, kindly, and clearly in 1–2 short sentences.\n\n"
        "Conversation so far:\n" + "\n".join(conversation_history) + "\nAI:"
    )
    response = model.generate_content(prompt)
    reply_text = response.text.strip()
    conversation_history.append(f"AI: {reply_text}")
    return jsonify({"response": reply_text})

@app.route("/transcribe", methods=["POST"])
def transcribe_audio():
    try:
        # Load audio from request
        audio_file = request.files["file"]
        audio_content = audio_file.read()

        # Init STT client
        client = speech.SpeechClient()

        audio = speech.RecognitionAudio(content=audio_content)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=48000,  # ✅ Match this to your actual file
            language_code="en-US"
        )

        # Call Google STT
        response = client.recognize(config=config, audio=audio)

        if not response.results:
            return jsonify({"transcription": ""})

        transcription = response.results[0].alternatives[0].transcript
        return jsonify({"transcription": transcription})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/speak", methods=["POST"])
def synthesize_speech():
    try:
        client = texttospeech.TextToSpeechClient()
        data = request.get_json()

        text = data.get("text", "")
        if not text:
            return jsonify({"error": "Text is required"}), 400

        input_text = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16
        )

        response = client.synthesize_speech(
            input=input_text, voice=voice, audio_config=audio_config
        )

        return send_file(
            io.BytesIO(response.audio_content),
            mimetype="audio/wav",
            download_name="response.wav"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    public_url = ngrok.connect(5000).public_url
    print(f"Public URL: {public_url}")
    app.run(port=5000)
