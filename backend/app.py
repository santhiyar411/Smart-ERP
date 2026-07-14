import json
import os
from datetime import datetime
from uuid import uuid4

from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from models.base import Base
from models.documents import Document
from models.employee import Employee
from models.project import Project
from services.extraction_service import extract_employee_info
from services.ocr_service import extract_text_from_uploaded_file
from services.upload_service import upload_file


app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
)

app.config["UPLOAD_FOLDER"] = os.path.join(os.getcwd(), "uploads")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024

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
            print(f"PostgreSQL unavailable: {exc}. Falling back to SQLite.")

    sqlite_url = os.getenv("SQLITE_URL", "sqlite:///erp.db")
    engine = create_engine(sqlite_url)
    print(f"Using SQLite: {sqlite_url}")
    return engine


engine = create_app_engine()
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(engine)


def serialize_employee(employee):
    return {
        "id": employee.employee_id,
        "employee_code": employee.employee_code,
        "name": employee.name,
        "email": employee.email,
        "phone": employee.phone,
        "department": employee.department,
        "designation": employee.designation,
        "joining_date": employee.joining_date,
    }


def serialize_document(document):
    return {
        "id": document.document_id,
        "employee_id": document.employee_id,
        "document_type": document.document_type,
        "file_path": document.file_path,
        "extracted_text": document.extracted_text,
        "upload_date": document.upload_date.isoformat() if document.upload_date else None,
    }


def serialize_project(project):
    assigned = []
    if project.assigned_employee_ids:
        try:
            assigned = json.loads(project.assigned_employee_ids)
        except Exception:
            assigned = []
    return {
        "id": project.id,
        "project_name": project.project_name,
        "description": project.description,
        "status": project.status,
        "start_date": project.start_date,
        "end_date": project.end_date,
        "assigned_employee_ids": assigned,
    }


@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.get("/dashboard")
def dashboard():
    session = SessionLocal()
    try:
        employee_count = session.query(Employee).count()
        document_count = session.query(Document).count()
        project_count = session.query(Project).count()
        return jsonify(
            {
                "total_employees": employee_count,
                "active_projects": project_count,
                "documents_uploaded": document_count,
                "pending_ocr": 0,
            }
        )
    finally:
        session.close()


@app.get("/dashboard/departments")
def department_stats():
    session = SessionLocal()
    try:
        from collections import Counter

        rows = session.query(Employee.department).filter(Employee.department.isnot(None)).all()
        counts = Counter(row[0] for row in rows)
        return jsonify([{"label": label, "value": value} for label, value in counts.items()])
    finally:
        session.close()


@app.get("/employees")
def list_employees():
    session = SessionLocal()
    try:
        employees = session.query(Employee).all()
        return jsonify([serialize_employee(e) for e in employees])
    finally:
        session.close()


@app.post("/employees")
def create_employee():
    data = request.get_json() or {}
    session = SessionLocal()
    try:
        employee = Employee(
            employee_code=data.get("employee_code", f"EMP{uuid4().hex[:6].upper()}"),
            name=data.get("name", "Unknown"),
            email=data.get("email", f"unknown_{uuid4().hex[:6]}@example.com"),
            phone=data.get("phone"),
            department=data.get("department"),
            designation=data.get("designation"),
            joining_date=data.get("joining_date"),
        )
        session.add(employee)
        session.commit()
        session.refresh(employee)
        return jsonify(serialize_employee(employee)), 201
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 400
    finally:
        session.close()


@app.put("/employees/<int:employee_id>")
def update_employee(employee_id):
    data = request.get_json() or {}
    session = SessionLocal()
    try:
        employee = session.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            return jsonify({"error": "Employee not found"}), 404

        employee.employee_code = data.get("employee_code", employee.employee_code)
        employee.name = data.get("name", employee.name)
        employee.email = data.get("email", employee.email)
        employee.phone = data.get("phone", employee.phone)
        employee.department = data.get("department", employee.department)
        employee.designation = data.get("designation", employee.designation)
        employee.joining_date = data.get("joining_date", employee.joining_date)

        session.commit()
        session.refresh(employee)
        return jsonify(serialize_employee(employee))
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 400
    finally:
        session.close()


@app.delete("/employees/<int:employee_id>")
def delete_employee(employee_id):
    session = SessionLocal()
    try:
        employee = session.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            return jsonify({"error": "Employee not found"}), 404

        session.delete(employee)
        session.commit()
        return jsonify({"message": "Employee deleted"}), 200
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 400
    finally:
        session.close()


@app.get("/projects")
def list_projects():
    session = SessionLocal()
    try:
        projects = session.query(Project).all()
        return jsonify([serialize_project(p) for p in projects])
    finally:
        session.close()


@app.post("/projects")
def create_project():
    data = request.get_json() or {}
    session = SessionLocal()
    try:
        project = Project(
            project_name=data.get("project_name", ""),
            description=data.get("description", ""),
            status=data.get("status", "ACTIVE"),
            start_date=data.get("start_date", ""),
            end_date=data.get("end_date", ""),
            assigned_employee_ids="[]",
        )
        session.add(project)
        session.commit()
        session.refresh(project)
        return jsonify(serialize_project(project)), 201
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 400
    finally:
        session.close()


@app.put("/projects/<int:project_id>")
def update_project(project_id):
    data = request.get_json() or {}
    session = SessionLocal()
    try:
        project = session.query(Project).filter(Project.id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404

        project.project_name = data.get("project_name", project.project_name)
        project.description = data.get("description", project.description)
        project.status = data.get("status", project.status)
        project.start_date = data.get("start_date", project.start_date)
        project.end_date = data.get("end_date", project.end_date)

        session.commit()
        session.refresh(project)
        return jsonify(serialize_project(project))
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 400
    finally:
        session.close()


@app.delete("/projects/<int:project_id>")
def delete_project(project_id):
    session = SessionLocal()
    try:
        project = session.query(Project).filter(Project.id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404

        session.delete(project)
        session.commit()
        return jsonify({"message": "Project deleted"}), 200
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 400
    finally:
        session.close()


@app.post("/projects/<int:project_id>/employees")
def assign_employee(project_id):
    data = request.get_json() or {}
    employee_id = data.get("employee_id")
    session = SessionLocal()
    try:
        project = session.query(Project).filter(Project.id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404

        assigned = []
        if project.assigned_employee_ids:
            try:
                assigned = json.loads(project.assigned_employee_ids)
            except Exception:
                assigned = []

        if employee_id in assigned:
            assigned.remove(employee_id)
        else:
            assigned.append(employee_id)

        project.assigned_employee_ids = json.dumps(assigned)
        session.commit()
        session.refresh(project)
        return jsonify(serialize_project(project))
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 400
    finally:
        session.close()


@app.get("/documents")
def list_documents():
    session = SessionLocal()
    try:
        documents = session.query(Document).all()
        return jsonify([serialize_document(d) for d in documents])
    finally:
        session.close()


@app.post("/documents/upload")
def upload_document():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file_storage = request.files["file"]
    if file_storage.filename == "":
        return jsonify({"error": "Empty file name"}), 400

    upload_result = upload_file(file_storage, upload_dir=app.config["UPLOAD_FOLDER"])
    file_path = upload_result["file_path"]

    if hasattr(file_storage, "stream") and file_storage.stream is not None:
        try:
            file_storage.stream.seek(0)
        except Exception:
            pass

    ocr_text = extract_text_from_uploaded_file(file_storage)
    extracted = extract_employee_info(ocr_text, source_name=file_storage.filename)

    session = SessionLocal()
    try:
        employee = None
        email = extracted.get("email")
        if email:
            employee = session.query(Employee).filter(Employee.email == email).first()

        if not employee:
            employee = Employee(
                employee_code=f"EMP{uuid4().hex[:8].upper()}",
                name=extracted.get("name") or "Unknown Employee",
                email=email or f"unknown_{uuid4().hex[:8]}@example.com",
                phone=extracted.get("phone_number"),
                department=None,
                designation=None,
                joining_date=None,
            )
            session.add(employee)
            session.commit()
            session.refresh(employee)

        document = Document(
            employee_id=employee.employee_id,
            document_type="uploaded_document",
            file_path=file_path,
            extracted_text=ocr_text,
            upload_date=datetime.utcnow(),
        )
        session.add(document)
        session.commit()
        session.refresh(document)

        return jsonify(
            {
                "message": "Document uploaded and processed successfully",
                "employee": {
                    "employee_id": employee.employee_id,
                    "name": employee.name,
                    "email": employee.email,
                    "phone": employee.phone,
                },
                "document": {
                    "document_id": document.document_id,
                    "file_path": document.file_path,
                },
                "extracted": extracted,
            }
        ), 201
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)