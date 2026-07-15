from flask import Blueprint, jsonify
from sqlalchemy import func
from database import SessionLocal
from models.employee import Employee
from models.employee_skills import EmployeeSkill
from models.project import Project, EmployeeProject
from models.project_requirements import ProjectRequirement
from .auth_route import token_required

dashboard_bp = Blueprint("dashboard_bp", __name__, url_prefix="/dashboard")

@dashboard_bp.route("/analytics", methods=["GET"])
@token_required
def get_analytics():
    session = SessionLocal()
    try:
        # Total active stats
        total_employees = session.query(func.count(Employee.employee_id)).scalar() or 0
        total_projects = session.query(func.count(Project.project_id)).scalar() or 0
        
        # Utilization rate: assigned employees / total employees
        assigned_employees_count = session.query(func.count(func.distinct(EmployeeProject.employee_id))).scalar() or 0
        util_rate = int((assigned_employees_count / total_employees) * 100) if total_employees > 0 else 0
        
        # Top registered skills
        top_skills_query = session.query(
            EmployeeSkill.skill_name,
            func.count(EmployeeSkill.employee_id).label("total_count"),
            func.avg(EmployeeSkill.proficiency_score).label("avg_score")
        ).group_by(EmployeeSkill.skill_name).order_by(func.count(EmployeeSkill.employee_id).desc()).limit(5).all()
        
        top_skills = [{
            "skill_name": item[0],
            "total_count": item[1],
            "avg_score": float(item[2]) if item[2] else 0.0
        } for item in top_skills_query]
        
        # Demanded technology (from project reqs)
        demand_tech_query = session.query(
            ProjectRequirement.required_skill,
            func.count(ProjectRequirement.project_id).label("count")
        ).group_by(ProjectRequirement.required_skill).order_by(func.count(ProjectRequirement.project_id).desc()).limit(5).all()
        
        demanded_tech = [{
            "required_skill": item[0],
            "count": item[1],
            "priority": "High" if item[1] > 2 else "Medium"
        } for item in demand_tech_query]
        
        # Heatmap: Average proficiency of skills per department query
        # Join Employee and EmployeeSkill, group by department and skill_name
        heatmap_query = session.query(
            Employee.department,
            EmployeeSkill.skill_name,
            func.avg(EmployeeSkill.proficiency_score).label("avg_proficiency")
        ).join(EmployeeSkill, Employee.employee_id == EmployeeSkill.employee_id)\
         .group_by(Employee.department, EmployeeSkill.skill_name)\
         .order_by(Employee.department, func.avg(EmployeeSkill.proficiency_score).desc()).all()
         
        heatmap = [{
            "department": item[0],
            "skill_name": item[1],
            "avg_proficiency": float(item[2]) if item[2] else 0.0
        } for item in heatmap_query]
        
        return jsonify({
            "utilization_rate": util_rate,
            "total_employees": total_employees,
            "total_projects": total_projects,
            "top_skills": top_skills,
            "demanded_tech": demanded_tech,
            "heatmap": heatmap
        }), 200
        
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()

@dashboard_bp.route("/summary", methods=["GET"])
@token_required
def get_dashboard_summary():
    # Simple compatibility layer matching base dashboard path
    session = SessionLocal()
    try:
        total_employees = session.query(func.count(Employee.employee_id)).scalar() or 0
        total_projects = session.query(func.count(Project.project_id)).scalar() or 0
        assigned_count = session.query(func.count(func.distinct(EmployeeProject.employee_id))).scalar() or 0
        
        return jsonify({
            "employeesCount": total_employees,
            "projectsCount": total_projects,
            "activeAssignments": assigned_count
        }), 200
    finally:
        session.close()