import os
from pathlib import Path
from datetime import datetime
from flask import Blueprint, jsonify, request
from werkzeug.utils import secure_filename

from database import SessionLocal
from models.documents import Document
from models.employee import Employee
from models.employee_skills import EmployeeSkill
from models.users import User
from services.extraction_service import extract_employee_info
from routes.auth_route import token_required

document_bp = Blueprint("document_bp", __name__, url_prefix="/documents")
UPLOAD_FOLDER = Path("uploads")
UPLOAD_FOLDER.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".txt"}

def allowed_file(filename):
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS

from services.ocr_service import extract_text_from_file_path

def parse_document_text(file_path):
    text, status = extract_text_from_file_path(file_path)
    return text, status

@document_bp.route("", methods=["GET"])
@token_required
def list_documents():
    session = SessionLocal()
    try:
        docs = session.query(Document).order_by(Document.upload_date.desc()).all()
        return jsonify([{
            "id": d.document_id,
            "employee_id": d.employee_id,
            "file_path": d.file_path,
            "document_type": d.document_type,
            "extracted_text": d.extracted_text,
            "upload_date": d.upload_date.isoformat() if d.upload_date else None
        } for d in docs]), 200
    finally:
        session.close()

@document_bp.route("/upload", methods=["POST"])
@token_required
def upload_document():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
        
    if not allowed_file(file.filename):
        return jsonify({"error": "Allowed file types: pdf, png, jpg, jpeg, txt"}), 400

    filename = secure_filename(file.filename)
    # Add timestamp prefix to avoid conflicts
    unique_filename = f"{int(datetime.utcnow().timestamp())}_{filename}"
    file_path = UPLOAD_FOLDER / unique_filename

    try:
        file.save(str(file_path))
    except Exception as e:
        return jsonify({"error": f"Failed to save file: {str(e)}"}), 500

    # Parse file path
    extracted_text, ocr_status = parse_document_text(file_path)

    # Logging backend data
    print(f"[OCR BACKEND LOG] Uploaded filename: {filename}")
    print(f"[OCR BACKEND LOG] Raw extracted text length: {len(extracted_text) if extracted_text else 0}")
    print(f"[OCR BACKEND LOG] OCR status: {ocr_status}")
    
    # Run AI extract
    info = extract_employee_info(extracted_text, source_name=filename)
    
    session = SessionLocal()
    employee_id = None
    target_email = info.get("email") or request.current_user["email"]
    
    try:
        # Search employee by email
        emp = session.query(Employee).filter(Employee.email == target_email).first()
        if not emp:
            # Fallback search by current logged in employee_id
            current_id = request.current_user.get("employee_id")
            if current_id:
                emp = session.query(Employee).filter(Employee.employee_code == current_id).first()
                
        if not emp:
            # Create a new employee profile automatically
            emp = Employee(
                name=info.get("name") or request.current_user["full_name"],
                email=target_email,
                department=request.current_user.get("department") or "Engineering",
                designation="AI Extracted Profile",
                employee_code=request.current_user.get("employee_id") or f"EMP{os.urandom(3).hex().upper()}"
            )
            session.add(emp)
            session.commit()
            session.refresh(emp)
            
        # Update employee phone or name if parsed and empty
        if info.get("phone") and not emp.phone:
            emp.phone = info.get("phone")
        if info.get("name") and emp.name == request.current_user["full_name"]:
            emp.name = info.get("name")

        employee_id = emp.employee_id
        
        # Save document entry
        doc_entry = Document(
            employee_id=employee_id,
            file_path=str(file_path),
            document_type="Resume/Qualifications",
            extracted_text=extracted_text,
            upload_date=datetime.utcnow()
        )
        session.add(doc_entry)
        
        # Sync skills
        extracted_skills = info.get("skills", [])
        if extracted_skills:
            # Delete old skills
            session.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id).delete()
            # Add new skills
            for idx, skill in enumerate(extracted_skills):
                p_score = 4 if idx % 2 == 0 else 5
                es = EmployeeSkill(
                    employee_id=employee_id,
                    skill_name=skill,
                    proficiency_score=p_score
                )
                session.add(es)
                
        session.commit()
        print(f"[DB LOG] Successfully saved document and employee information to database. Status: SUCCESS")

        # Automatically calculate and store recommendations
        from routes.recommendations_route import generate_and_save_recs_for_employee
        generate_and_save_recs_for_employee(employee_id, session)

        return jsonify({
            "message": "Qualifications parsed successfully!",
            "extracted_info": {
                "name": info.get("name"),
                "email": info.get("email"),
                "phone": info.get("phone"),
                "skills": info.get("skills"),
                "degree": info.get("degree"),
                "certifications": info.get("certifications"),
                "experience": info.get("experience"),
                "raw_text": info.get("raw_text")
            },
            "linked_employee": emp.name,
            "employee_id": employee_id
        }), 201
        
    except Exception as exc:
        session.rollback()
        print(f"[DB LOG ERROR] Failed to save document: {str(exc)}. Status: FAILED")
        return jsonify({"error": f"Failed database sync: {str(exc)}"}), 500
    finally:
        session.close()
