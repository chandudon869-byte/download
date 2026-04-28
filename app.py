from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os

app = Flask(__name__)
CORS(app)  # allow requests from apps/web

# ✅ Home route (to avoid "URL not found")
@app.route('/')
def home():
    return "Server is running ✅"

# ✅ Download API
@app.route('/download', methods=['GET', 'POST'])
def download():
    # Optional GET for testing in browser
    if request.method == "GET":
        return "Send POST request with JSON: { \"url\": \"video_link\" }"

    data = request.get_json()
    if not data or "url" not in data:
        return jsonify({"error": "No URL provided"}), 400

    url = data.get("url")

    ydl_opts = {
        'quiet': True,
        'format': 'best'
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            return jsonify({
                "title": info.get("title"),
                "video_url": info.get("url"),
                "thumbnail": info.get("thumbnail")
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ Run properly on Render
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))