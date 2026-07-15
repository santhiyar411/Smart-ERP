from flask import Blueprint, jsonify
from database import SessionLocal
from models.employee import Employee
from models.employee_skills import EmployeeSkill
from models.project import Project
from models.project_requirements import ProjectRequirement
from routes.auth_route import token_required

recommendations_bp = Blueprint("recommendations_bp", __name__, url_prefix="/recommendations")

def calculate_match(emp_skills, proj_reqs):
    # Normalize skill names
    emp_set = {s.skill_name.lower().strip() for s in emp_skills}
    req_set = {r.required_skill.lower().strip() for r in proj_reqs}
    
    if not req_set:
        return 100, list(emp_set), []
        
    matched = emp_set.intersection(req_set)
    missing = req_set.difference(emp_set)
    
    match_percentage = int((len(matched) / len(req_set)) * 100)
    
    # Capitalize for display
    matched_display = [s.title() for s in matched]
    missing_display = [s.title() for s in missing]
    
    return match_percentage, matched_display, missing_display

@recommendations_bp.route("/project/<int:project_id>", methods=["GET"])
@token_required
def recommend_employees_for_project(project_id):
    session = SessionLocal()
    try:
        project = session.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return jsonify({"error": "Project not found"}), 404
            
        reqs = session.query(ProjectRequirement).filter(ProjectRequirement.project_id == project_id).all()
        employees = session.query(Employee).all()
        
        recs = []
        for emp in employees:
            skills = session.query(EmployeeSkill).filter(EmployeeSkill.employee_id == emp.employee_id).all()
            match_pct, matched_skills, missing_skills = calculate_match(skills, reqs)
            
            recs.append({
                "employee_id": emp.employee_id,
                "name": emp.name,
                "email": emp.email,
                "department": emp.department,
                "designation": emp.designation,
                "match_percentage": match_pct,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills
            })
            
        # Sort recommendations descending by match percentage
        recs.sort(key=lambda x: x["match_percentage"], reverse=True)
            
        return jsonify({
            "project_name": project.project_name,
            "required_skills": [{
                "skill_name": r.required_skill,
                "priority_level": r.priority_level
            } for r in reqs],
            "recommendations": recs
        }), 200
    finally:
        session.close()

@recommendations_bp.route("/employee/<int:employee_id>", methods=["GET"])
@token_required
def recommend_projects_for_employee(employee_id):
    session = SessionLocal()
    try:
        employee = session.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            return jsonify({"error": "Employee not found"}), 404
            
        skills = session.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id).all()
        projects = session.query(Project).all()
        
        recs = []
        for proj in projects:
            reqs = session.query(ProjectRequirement).filter(ProjectRequirement.project_id == proj.project_id).all()
            match_pct, matched_skills, missing_skills = calculate_match(skills, reqs)
            
            recs.append({
                "project_id": proj.project_id,
                "project_name": proj.project_name,
                "description": proj.description,
                "status": proj.status,
                "match_percentage": match_pct,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills
            })
            
        # Sort recommendations descending by match percentage
        recs.sort(key=lambda x: x["match_percentage"], reverse=True)
        
        return jsonify({
            "employee_name": employee.name,
            "employee_skills": [{
                "skill_name": s.skill_name,
                "proficiency_score": s.proficiency_score
            } for s in skills],
            "recommendations": recs
        }), 200
    finally:
        session.close()
