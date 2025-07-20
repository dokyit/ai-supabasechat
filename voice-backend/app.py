from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import whisper
import ChatTTS
import soundfile as sf
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

whisper_model = whisper.load_model("base")
chattts = ChatTTS.Chat()
chattts.load(compile=False)  # Use load() instead of download_models()

@app.route("/api/transcribe", methods=["POST"])
def transcribe():
    audio = request.files["audio"]
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        audio.save(tmp.name)
        result = whisper_model.transcribe(tmp.name)
        os.unlink(tmp.name)
    return jsonify({"text": result["text"]})

@app.route("/api/tts", methods=["POST"])
def tts():
    text = request.json["text"]
    wav = chattts.infer([text])[0]  # Note: pass text as a list
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sf.write(tmp.name, wav, 24000)
        tmp.flush()
        return send_file(tmp.name, mimetype="audio/wav", as_attachment=False)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)