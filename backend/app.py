import os
from flask import Flask, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from models.base import Base

# Import modular route blueprints
from routes.auth_route import auth_bp
from routes.employee_route import employee_bp
from routes.project_route import project_bp
from routes.document_route import document_bp
from routes.recommendations_route import recommendations_bp
from routes.dashboard_route import dashboard_bp

app = Flask(__name__)

# Configure CORS
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
)

app.config["UPLOAD_FOLDER"] = os.path.join(os.getcwd(), "uploads")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

# Setup database helper
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:santhiya4116@127.0.0.1:5432/erpdb")

def create_app_engine():
    database_url = os.getenv("DATABASE_URL", "").strip()
    if database_url:
        try:
            engine = create_engine(database_url, pool_pre_ping=True)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"Connected to PostgreSQL: {database_url}")
            return engine
        except Exception as exc:
            print(f"PostgreSQL Connection Error: {exc}. Falling back to SQLite.")

    sqlite_url = os.getenv("SQLITE_URL", "sqlite:///erp.db")
    engine = create_engine(sqlite_url)
    print(f"Using SQLite database: {sqlite_url}")
    return engine

engine = create_app_engine()
SessionLocal = sessionmaker(bind=engine)

# Initalize tables
Base.metadata.create_all(engine)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "database": "connected"}), 200

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(employee_bp)
app.register_blueprint(project_bp)
app.register_blueprint(document_bp)
app.register_blueprint(recommendations_bp)
app.register_blueprint(dashboard_bp)

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)