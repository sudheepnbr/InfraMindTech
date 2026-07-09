"""
InfraMindTech — Local CMS Server
Run: http://localhost:8080
Admin: http://localhost:8080/admin/
"""

import json
import os
import uuid
from functools import wraps
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, session
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).parent
CONTENT_FILE = BASE_DIR / "data" / "content.json"
ENV_FILE = BASE_DIR / ".env"
UPLOAD_DIR = BASE_DIR / "images" / "uploads"
ALLOWED_IMAGE = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"}
ALLOWED_VIDEO = {".mp4", ".webm", ".ogg"}
ALLOWED_EXT = ALLOWED_IMAGE | ALLOWED_VIDEO

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def load_env():
    env = {
        "ADMIN_USERNAME": "admin",
        "ADMIN_PASSWORD": "InfraMind@2026",
        "SECRET_KEY": "imt-dev-secret-key"
    }
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                env[key.strip()] = val.strip()
    for key in env:
        if os.environ.get(key):
            env[key] = os.environ[key]
    return env

ENV = load_env()

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")
app.secret_key = ENV["SECRET_KEY"]
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"

ALLOWED_CORS_ORIGINS = (
    "https://sudheepnbr.github.io",
)


@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin and (
        origin in ALLOWED_CORS_ORIGINS
        or origin.startswith("https://sudheepnbr.github.io/")
    ):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Vary"] = "Origin"
    return response


@app.route("/api/content", methods=["OPTIONS"])
def content_options():
    return "", 204


def read_content():
    with open(CONTENT_FILE, encoding="utf-8") as f:
        return json.load(f)


def write_content(data):
    with open(CONTENT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("logged_in"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


PAGE_DIRS = {"about", "services", "products", "contact"}


def _page_view(page_name):
    def view():
        return send_from_directory(BASE_DIR / page_name, "index.html")
    return view


for _page in PAGE_DIRS:
    app.add_url_rule(f"/{_page}/", endpoint=f"page_{_page}_slash", view_func=_page_view(_page))
    app.add_url_rule(f"/{_page}", endpoint=f"page_{_page}", view_func=_page_view(_page))


@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/admin/")
@app.route("/admin")
def admin_panel():
    return send_from_directory(BASE_DIR / "admin", "index.html")


@app.route("/<path:filepath>")
def static_files(filepath):
    clean = filepath.rstrip("/")
    if clean in PAGE_DIRS:
        index_file = BASE_DIR / clean / "index.html"
        if index_file.is_file():
            return send_from_directory(BASE_DIR / clean, "index.html")

    full = BASE_DIR / filepath
    if full.is_file():
        return send_from_directory(BASE_DIR, filepath)

    if not filepath.endswith(".html"):
        index_in_dir = BASE_DIR / clean / "index.html"
        if index_in_dir.is_file():
            return send_from_directory(BASE_DIR / clean, "index.html")

    return "Not Found", 404


@app.route("/api/content", methods=["GET"])
def get_content():
    return jsonify(read_content())


@app.route("/api/content", methods=["PUT"])
@login_required
def update_content():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    write_content(data)
    return jsonify({"success": True, "message": "Content saved successfully"})


@app.route("/api/login", methods=["POST"])
def login():
    body = request.get_json() or {}
    username = body.get("username", "")
    password = body.get("password", "")
    if username == ENV["ADMIN_USERNAME"] and password == ENV["ADMIN_PASSWORD"]:
        session["logged_in"] = True
        session["username"] = username
        return jsonify({"success": True, "username": username})
    return jsonify({"error": "Invalid username or password"}), 401


@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/api/auth/check", methods=["GET"])
def auth_check():
    if session.get("logged_in"):
        return jsonify({"logged_in": True, "username": session.get("username")})
    return jsonify({"logged_in": False})


@app.route("/api/upload", methods=["POST"])
@login_required
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        return jsonify({"error": f"File type {ext} not allowed"}), 400

    filename = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
    save_path = UPLOAD_DIR / unique_name
    file.save(save_path)

    url = f"/images/uploads/{unique_name}"
    file_type = "video" if ext in ALLOWED_VIDEO else "image"
    return jsonify({"success": True, "url": url, "filename": unique_name, "type": file_type})


@app.route("/api/media", methods=["GET"])
@login_required
def list_media():
    files = []
    if UPLOAD_DIR.exists():
        for f in sorted(UPLOAD_DIR.iterdir()):
            if f.is_file() and f.suffix.lower() in ALLOWED_EXT:
                ext = f.suffix.lower()
                files.append({
                    "url": f"/images/uploads/{f.name}",
                    "name": f.name,
                    "type": "video" if ext in ALLOWED_VIDEO else "image"
                })
    return jsonify(files)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print("\n  InfraMindTech CMS Server")
    print("  ========================")
    print(f"  Website:  http://localhost:{port}")
    print(f"  Admin:    http://localhost:{port}/admin/")
    print(f"  Login:    {ENV['ADMIN_USERNAME']} / {ENV['ADMIN_PASSWORD']}")
    print("  ========================\n")
    app.run(host="0.0.0.0", port=port, debug=True)
