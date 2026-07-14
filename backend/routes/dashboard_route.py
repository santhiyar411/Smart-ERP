from flask import Blueprint, jsonify
from sqlalchemy import func

from ..models.employee import Employee
from ..models.project import Project
from ..models.documents import Document

try:
    from ..database import SessionLocal
except ImportError:
    SessionLocal = None


dashboard_bp = Blueprint("dashboard_bp", __name__, url_prefix="/dashboard")


def get_db_session():
    if SessionLocal is None:
        raise RuntimeError(
            "No database session factory found. Make sure your app exposes SessionLocal from backend.database."
        )
    return SessionLocal()


@dashboard_bp.route("", methods=["GET"])
def dashboard_summary():
    session = get_db_session()
    try:
        total_employees = session.query(func.count(Employee.employee_id)).scalar() or 0
        total_projects = session.query(func.count(Project.project_id)).scalar() or 0
        documents_uploaded = session.query(func.count(Document.document_id)).scalar() or 0

        department_rows = (
            session.query(Employee.department, func.count(Employee.employee_id))
            .filter(Employee.department.isnot(None))
            .group_by(Employee.department)
            .all()
        )

        employees_by_department = {
            department: count for department, count in department_rows if department
        }

        return jsonify(
            {
                "total_employees": total_employees,
                "total_projects": total_projects,
                "documents_uploaded": documents_uploaded,
                "employees_by_department": employees_by_department,
            }
        ), 200
    finally:
        session.close()


@dashboard_bp.route("/departments", methods=["GET"])
def employees_by_department():
    session = get_db_session()
    try:
        department_rows = (
            session.query(Employee.department, func.count(Employee.employee_id))
            .filter(Employee.department.isnot(None))
            .group_by(Employee.department)
            .all()
        )

        return jsonify(
            {
                "employees_by_department": {
                    department: count for department, count in department_rows if department
                }
            }
        ), 200
    finally:
        session.close()


def init_app(app):
    app.register_blueprint(dashboard_bp)