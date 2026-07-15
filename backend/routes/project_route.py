from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError
from models.project import Project, EmployeeProject
from models.employee import Employee
from models.project_requirements import ProjectRequirement
from database import SessionLocal
from routes.auth_route import token_required, role_required

project_bp = Blueprint("project_bp", __name__, url_prefix="/projects")

def serialize_project(project, session):
    # Fetch assigned employee details
    assignments = session.query(EmployeeProject).filter(EmployeeProject.project_id == project.project_id).all()
    employees = []
    for ass in assignments:
        emp = session.query(Employee).filter(Employee.employee_id == ass.employee_id).first()
        if emp:
            employees.append({
                "id": emp.employee_id,
                "name": emp.name,
                "email": emp.email,
                "department": emp.department,
                "designation": emp.designation
            })
            
    # Fetch requirements
    reqs = session.query(ProjectRequirement).filter(ProjectRequirement.project_id == project.project_id).all()
    requirements = [{
        "requirement_id": r.requirement_id,
        "required_skill": r.required_skill,
        "priority_level": r.priority_level
    } for r in reqs]
    
    return {
        "project_id": project.project_id,
        "project_name": project.project_name,
        "description": project.description,
        "start_date": project.start_date,
        "end_date": project.end_date,
        "status": project.status,
        "employees": employees,
        "requirements": requirements
    }

@project_bp.route("", methods=["GET"])
@token_required
def list_projects():
    session = SessionLocal()
    try:
        projects = session.query(Project).all()
        return jsonify([serialize_project(p, session) for p in projects]), 200
    finally:
        session.close()

@project_bp.route("", methods=["POST"])
@token_required
@role_required(["Admin", "HR"])
def create_project():
    data = request.get_json(silent=True) or {}
    
    name = data.get("project_name")
    if not name:
        return jsonify({"error": "project_name is required"}), 400

    session = SessionLocal()
    try:
        project = Project(
            project_name=name,
            description=data.get("description"),
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
            status=data.get("status", "Planning")
        )
        session.add(project)
        session.commit()
        session.refresh(project)
        return jsonify(serialize_project(project, session)), 201
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()

@project_bp.route("/<int:project_id>", methods=["PUT"])
@token_required
@role_required(["Admin", "HR"])
def update_project(project_id):
    data = request.get_json(silent=True) or {}
    
    session = SessionLocal()
    try:
        project = session.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404

        if "project_name" in data:
            project.project_name = data["project_name"]
        if "description" in data:
            project.description = data["description"]
        if "start_date" in data:
            project.start_date = data["start_date"]
        if "end_date" in data:
            project.end_date = data["end_date"]
        if "status" in data:
            project.status = data["status"]

        session.commit()
        session.refresh(project)
        return jsonify(serialize_project(project, session)), 200
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()

@project_bp.route("/<int:project_id>", methods=["DELETE"])
@token_required
@role_required(["Admin", "HR"])
def delete_project(project_id):
    session = SessionLocal()
    try:
        project = session.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404

        # Remove requirements & assignments first in Postgres cascade (if not cascade)
        session.query(ProjectRequirement).filter(ProjectRequirement.project_id == project_id).delete()
        session.query(EmployeeProject).filter(EmployeeProject.project_id == project_id).delete()

        session.delete(project)
        session.commit()
        return jsonify({"message": "Project deleted successfully"}), 200
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()

# Assignments REST
@project_bp.route("/<int:project_id>/employees", methods=["POST"])
@token_required
@role_required(["Admin", "HR"])
def assign_employee(project_id):
    data = request.get_json(silent=True) or {}
    emp_id = data.get("employee_id")
    if not emp_id:
        return jsonify({"error": "employee_id is required"}), 400

    session = SessionLocal()
    try:
        # Verify exists
        proj = session.query(Project).filter(Project.project_id == project_id).first()
        emp = session.query(Employee).filter(Employee.employee_id == emp_id).first()
        if not proj or not emp:
            return jsonify({"error": "Project or Employee not found"}), 404

        # Check existing
        existing = session.query(EmployeeProject).filter(
            EmployeeProject.project_id == project_id, 
            EmployeeProject.employee_id == emp_id
        ).first()
        
        if existing:
            return jsonify({"message": "Employee already assigned to project"}), 200

        assign = EmployeeProject(project_id=project_id, employee_id=emp_id)
        session.add(assign)
        session.commit()
        return jsonify({"message": "Employee assigned to project successfully"}), 200
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()

@project_bp.route("/<int:project_id>/employees/<int:employee_id>", methods=["DELETE"])
@token_required
@role_required(["Admin", "HR"])
def remove_employee(project_id, employee_id):
    session = SessionLocal()
    try:
        assign = session.query(EmployeeProject).filter(
            EmployeeProject.project_id == project_id,
            EmployeeProject.employee_id == employee_id
        ).first()

        if not assign:
            return jsonify({"error": "Assignment not found"}), 404

        session.delete(assign)
        session.commit()
        return jsonify({"message": "Employee removed from project"}), 200
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()

# Requirements Sub-Blueprint paths
@project_bp.route("/<int:project_id>/requirements", methods=["GET"])
@token_required
def list_requirements(project_id):
    session = SessionLocal()
    try:
        reqs = session.query(ProjectRequirement).filter(ProjectRequirement.project_id == project_id).all()
        return jsonify([{
            "requirement_id": r.requirement_id,
            "required_skill": r.required_skill,
            "priority_level": r.priority_level
        } for r in reqs]), 200
    finally:
        session.close()

@project_bp.route("/<int:project_id>/requirements", methods=["POST"])
@token_required
@role_required(["Admin", "HR"])
def create_requirement(project_id):
    data = request.get_json(silent=True) or {}
    skill = data.get("required_skill")
    priority = data.get("priority_level", "Medium")
    if not skill:
        return jsonify({"error": "required_skill is required"}), 400

    session = SessionLocal()
    try:
        proj = session.query(Project).filter(Project.project_id == project_id).first()
        if not proj:
            return jsonify({"error": "Project not found"}), 404

        req = ProjectRequirement(
            project_id=project_id,
            required_skill=skill.strip(),
            priority_level=priority
        )
        session.add(req)
        session.commit()
        session.refresh(req)
        return jsonify({
            "requirement_id": req.requirement_id,
            "required_skill": req.required_skill,
            "priority_level": req.priority_level
        }), 201
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()

@project_bp.route("/<int:project_id>/requirements/<int:req_id>", methods=["DELETE"])
@token_required
@role_required(["Admin", "HR"])
def delete_requirement(project_id, req_id):
    session = SessionLocal()
    try:
        req = session.query(ProjectRequirement).filter(
            ProjectRequirement.project_id == project_id,
            ProjectRequirement.requirement_id == req_id
        ).first()

        if not req:
            return jsonify({"error": "Requirement not found"}), 404

        session.delete(req)
        session.commit()
        return jsonify({"message": "Requirement deleted"}), 200
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()
