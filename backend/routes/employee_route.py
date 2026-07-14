from datetime import datetime
from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from ..models.employee import Employee
from ..models.project import Project, EmployeeProject

try:
    from ..database import SessionLocal
except ImportError:
    SessionLocal = None


project_bp = Blueprint("project_bp", __name__, url_prefix="/projects")


def get_db_session():
    if SessionLocal is None:
        raise RuntimeError(
            "No database session factory found. Make sure your app exposes SessionLocal from backend.database."
        )
    return SessionLocal()


def parse_date(value):
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return datetime.strptime(value, "%Y-%m-%d").date()
    return value


def serialize_project(project):
    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "description": project.description,
        "status": project.status,
        "start_date": project.start_date.isoformat() if project.start_date else None,
        "end_date": project.end_date.isoformat() if project.end_date else None,
    }


@project_bp.route("", methods=["GET"])
def list_projects():
    session = get_db_session()
    try:
        projects = session.query(Project).all()
        return jsonify([serialize_project(p) for p in projects]), 200
    finally:
        session.close()


@project_bp.route("", methods=["POST"])
def create_project():
    payload = request.get_json(silent=True) or {}

    project_name = payload.get("project_name")
    if not project_name:
        return jsonify({"error": "project_name is required"}), 400

    session = get_db_session()
    try:
        project = Project(
            project_name=project_name,
            description=payload.get("description"),
            status=payload.get("status", "ACTIVE"),
            start_date=parse_date(payload.get("start_date")),
            end_date=parse_date(payload.get("end_date")),
        )
        session.add(project)
        session.commit()
        session.refresh(project)
        return jsonify(serialize_project(project)), 201
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Could not create project"}), 400
    finally:
        session.close()


@project_bp.route("/<int:project_id>", methods=["GET"])
def get_project(project_id):
    session = get_db_session()
    try:
        project = session.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404
        return jsonify(serialize_project(project)), 200
    finally:
        session.close()


@project_bp.route("/<int:project_id>", methods=["PUT"])
def update_project(project_id):
    payload = request.get_json(silent=True) or {}

    session = get_db_session()
    try:
        project = session.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404

        if "project_name" in payload:
            project.project_name = payload["project_name"]
        if "description" in payload:
            project.description = payload["description"]
        if "status" in payload:
            project.status = payload["status"]
        if "start_date" in payload:
            project.start_date = parse_date(payload["start_date"])
        if "end_date" in payload:
            project.end_date = parse_date(payload["end_date"])

        session.commit()
        return jsonify(serialize_project(project)), 200
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Could not update project"}), 400
    finally:
        session.close()


@project_bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    session = get_db_session()
    try:
        project = session.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404

        session.delete(project)
        session.commit()
        return jsonify({"message": "Project deleted successfully"}), 200
    finally:
        session.close()


@project_bp.route("/<int:project_id>/employees", methods=["GET"])
def list_project_employees(project_id):
    session = get_db_session()
    try:
        project = session.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404

        employees = (
            session.query(Employee)
            .join(EmployeeProject, EmployeeProject.employee_id == Employee.employee_id)
            .filter(EmployeeProject.project_id == project_id)
            .all()
        )

        return jsonify([
            {
                "employee_id": emp.employee_id,
                "employee_code": emp.employee_code,
                "name": emp.name,
                "email": emp.email,
            }
            for emp in employees
        ]), 200
    finally:
        session.close()


@project_bp.route("/<int:project_id>/employees", methods=["POST"])
def assign_employee_to_project(project_id):
    payload = request.get_json(silent=True) or {}

    employee_id = payload.get("employee_id")
    if not employee_id:
        return jsonify({"error": "employee_id is required"}), 400

    session = get_db_session()
    try:
        project = session.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404

        employee = session.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            return jsonify({"error": "Employee not found"}), 404

        existing = (
            session.query(EmployeeProject)
            .filter(
                EmployeeProject.project_id == project_id,
                EmployeeProject.employee_id == employee_id,
            )
            .first()
        )

        if existing:
            return jsonify({"message": "Employee already assigned to this project"}), 200

        assignment = EmployeeProject(employee_id=employee_id, project_id=project_id)
        session.add(assignment)
        session.commit()

        return jsonify({
            "message": "Employee assigned to project successfully",
            "project_id": project_id,
            "employee_id": employee_id,
        }), 201
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Could not assign employee to project"}), 400
    finally:
        session.close()


@project_bp.route("/<int:project_id>/employees/<int:employee_id>", methods=["DELETE"])
def remove_employee_from_project(project_id, employee_id):
    session = get_db_session()
    try:
        assignment = (
            session.query(EmployeeProject)
            .filter(
                EmployeeProject.project_id == project_id,
                EmployeeProject.employee_id == employee_id,
            )
            .first()
        )

        if not assignment:
            return jsonify({"error": "Assignment not found"}), 404

        session.delete(assignment)
        session.commit()
        return jsonify({"message": "Employee removed from project successfully"}), 200
    finally:
        session.close()


def init_app(app):
    app.register_blueprint(project_bp)