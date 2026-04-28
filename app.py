from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp

app = Flask(__name__)
CORS(app)

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
        "noplaylist": True,
        "nocheckcertificate": True,
        "ignoreerrors": True,
        "no_warnings": True
    }

    try:

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            video = ydl.extract_info(url, download=False)

        if not video:
            return jsonify({
                "status": "failed",
                "error": "Could not fetch video"
            }), 500

        qualities = []

        formats = video.get("formats") or []

        for f in formats:

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

        print("SERVER ERROR:", str(e))

        return jsonify({
            "status": "failed",
            "error": str(e)
        }), 500


if __name__ == "__main__":
    app.run()