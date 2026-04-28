from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Metadata API running ✅"

@app.route("/info", methods=["POST"])
def info():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    url = data.get("url")

    if not url:
        return jsonify({"error": "No URL"}), 400

    ydl_opts = {
        "quiet": True,
        "skip_download": True,
        "noplaylist": True
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            video = ydl.extract_info(url, download=False)

        return jsonify({
            "status": "ok",
            "title": video.get("title"),
            "thumbnail": video.get("thumbnail"),
            "duration": video.get("duration"),
            "source": video.get("extractor")
        })

    except Exception as e:
        return jsonify({
            "status": "failed",
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)