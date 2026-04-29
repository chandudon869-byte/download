from fastapi import FastAPI
from fastapi.responses import JSONResponse
import yt_dlp

app = FastAPI()

@app.get("/")
def home():
    return {"status": "working"}

@app.get("/extract")
def extract(url: str):

    ydl_opts = {
        "quiet": True,
        "noplaylist": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:

            info = ydl.extract_info(url, download=False)

            formats = []

            for f in info.get("formats", []):

                if f.get("url"):

                    formats.append({
                        "format_id": f.get("format_id"),
                        "ext": f.get("ext"),
                        "quality": f.get("format_note"),
                        "resolution": f.get("resolution"),
                        "filesize": f.get("filesize"),
                        "url": f.get("url")
                    })

            return JSONResponse({
                "success": True,
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "formats": formats
            })

    except Exception as e:

        return JSONResponse({
            "success": False,
            "error": str(e)
        })