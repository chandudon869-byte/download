from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "API Running ✅"

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
        "noplaylist": True,
        "skip_download": True
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            video = ydl.extract_info(url, download=False)

        qualities = []

        for f in video.get("formats", []):

            file_url = f.get("url")

            if not file_url:
                continue

            qualities.append({
                "quality": f.get("format_note") or "Unknown",
                "ext": f.get("ext"),
                "url": file_url
            })

        return jsonify({
            "status": "ok",
            "title": video.get("title"),
            "thumbnail": video.get("thumbnail"),
            "duration": video.get("duration"),
            "qualities": qualities[:10]
        })

    except Exception as e:
        return jsonify({
            "status": "failed",
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run()