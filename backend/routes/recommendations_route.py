from flask import Blueprint, jsonify, request
from database import SessionLocal
from models.employee import Employee
from models.employee_skills import EmployeeSkill
from models.project import Project, EmployeeProject
from models.project_requirements import ProjectRequirement
from models.recommended_projects import RecommendedProject
from routes.auth_route import token_required

recommendations_bp = Blueprint("recommendations_bp", __name__, url_prefix="/recommendations")

PREDEFINED_PROJECTS = [
    {
        "title": "MERN E-Commerce Platform",
        "description": "A high-performance modern e-commerce web application built on the MERN stack with authentication and payment integrations.",
        "required_skills": ["React", "Node.js", "MongoDB"],
        "difficulty": "Intermediate"
    },
    {
        "title": "Crop Prediction System",
        "description": "An intelligent machine learning model backend for predicting high-yielding crops based on environmental parameters.",
        "required_skills": ["Python", "Machine Learning"],
        "difficulty": "Intermediate"
    },
    {
        "title": "AI Document Processing System",
        "description": "An OCR document indexing and indexing search database system with dynamic analytics dashboards.",
        "required_skills": ["Python", "Flask", "OCR"],
        "difficulty": "Advanced"
    },
    {
        "title": "Business Analytics Dashboard",
        "description": "A business dashboard linking SQL databases to Power BI visualizations for management reports.",
        "required_skills": ["Power BI", "SQL"],
        "difficulty": "Beginner"
    },
    {
        "title": "Employee Management System",
        "description": "A robust backend system written in Java utilizing relational SQL schemas for enterprise tracking.",
        "required_skills": ["Java", "SQL"],
        "difficulty": "Beginner"
    },
    {
        "title": "Resume Screening System",
        "description": "An AI-powered OCR screening dashboard system evaluating and analyzing uploaded resumes.",
        "required_skills": ["React", "Python", "OCR"],
        "difficulty": "Advanced"
    },
    {
        "title": "AI Chatbot System",
        "description": "An automated chatbot trained on corporate knowledgebases using artificial neural networks.",
        "required_skills": ["Machine Learning", "Deep Learning"],
        "difficulty": "Advanced"
    },
    {
        "title": "Cloud DevOps Monitoring System",
        "description": "A containerized system deployment utilizing AWS cloud services, Docker containers, and Kubernetes orchestration.",
        "required_skills": ["AWS", "Docker", "Kubernetes"],
        "difficulty": "Advanced"
    }
]

def generate_and_save_recs_for_employee(employee_id, session):
    """
    Computes matching percentages with PREDEFINED_PROJECTS for a given employee 
    and saves/updates them in the recommended_projects database table.
    """
    try:
        # Fetch employee skills
        skills_list = session.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id).all()
        emp_skills = {s.skill_name.lower().strip() for s in skills_list}

        # Clear existing recommendations
        session.query(RecommendedProject).filter(RecommendedProject.employee_id == employee_id).delete()

        print(f"[RECS LOG] Generating project recommendations for employee_id: {employee_id}. Skills: {emp_skills}")

        for proj in PREDEFINED_PROJECTS:
            reqs = proj["required_skills"]
            req_set = {r.lower().strip() for r in reqs}

            matched = emp_skills.intersection(req_set)
            score = int((len(matched) / len(req_set)) * 100) if req_set else 100

            rec_entry = RecommendedProject(
                employee_id=employee_id,
                project_title=proj["title"],
                description=proj["description"],
                required_skills=",".join(reqs),
                difficulty=proj["difficulty"],
                recommendation_score=score
            )
            session.add(rec_entry)
        
        session.commit()
        print(f"[RECS LOG] Successfully saved recommendations for employee_id: {employee_id}")
    except Exception as exc:
        session.rollback()
        print(f"[RECS LOG ERROR] Failed to save recommendations: {exc}")


def calculate_match(emp_skills, proj_reqs):
    emp_set = {s.skill_name.lower().strip() for s in emp_skills}
    req_set = {r.required_skill.lower().strip() for r in proj_reqs}
    
    if not req_set:
        return 100, list(emp_set), []
        
    matched = emp_set.intersection(req_set)
    missing = req_set.difference(emp_set)
    
    match_percentage = int((len(matched) / len(req_set)) * 100)
    
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
        emp_skills_list = [s.skill_name for s in skills]

        # Calculate recommendations dynamically if recommended_projects is empty
        recs_count = session.query(RecommendedProject).filter(RecommendedProject.employee_id == employee_id).count()
        if recs_count == 0:
            generate_and_save_recs_for_employee(employee_id, session)

        db_recs = session.query(RecommendedProject).filter(RecommendedProject.employee_id == employee_id).all()
        
        recs = []
        for rec in db_recs:
            reqs_list = rec.required_skills.split(",") if rec.required_skills else []
            emp_skills_lower = {s.lower().strip() for s in emp_skills_list}

            matched_skills = []
            missing_skills = []
            for r in reqs_list:
                if r.lower().strip() in emp_skills_lower:
                    matched_skills.append(r)
                else:
                    missing_skills.append(r)

            recs.append({
                "recommendation_id": rec.recommendation_id,
                "project_name": rec.project_title,
                "description": rec.description,
                "difficulty": rec.difficulty,
                "match_percentage": rec.recommendation_score,
                "matched_skills": matched_skills,
                "missing_skills": missing_skills
            })
            
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


@recommendations_bp.route("/assign", methods=["POST"])
@token_required
def assign_recommended_project():
    """
    Creates project dynamically if it doesn't exist, attaches requirements, 
    and assigns the employee to it.
    """
    data = request.get_json(silent=True) or {}
    employee_id = data.get("employee_id")
    project_title = data.get("project_title")

    if not employee_id or not project_title:
        return jsonify({"error": "employee_id and project_title are required"}), 400

    session = SessionLocal()
    try:
        # Check employee exists
        employee = session.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            return jsonify({"error": "Employee not found"}), 404

        # Check if project exists in database
        project = session.query(Project).filter(Project.project_name == project_title).first()
        
        if not project:
            # Look up metadata from predefined projects
            proj_meta = next((item for item in PREDEFINED_PROJECTS if item["title"] == project_title), None)
            desc = proj_meta["description"] if proj_meta else "AI Recommended project"
            
            project = Project(
                project_name=project_title,
                description=desc,
                status="ACTIVE",
                start_date=None,
                end_date=None
            )
            session.add(project)
            session.commit()
            session.refresh(project)

            # Create project requirements
            if proj_meta:
                for skill in proj_meta["required_skills"]:
                    req = ProjectRequirement(
                        project_id=project.project_id,
                        required_skill=skill,
                        priority_level="High"
                    )
                    session.add(req)
                session.commit()

        # Check if already assigned
        existing = session.query(EmployeeProject).filter(
            EmployeeProject.project_id == project.project_id,
            EmployeeProject.employee_id == employee_id
        ).first()

        if not existing:
            assignment = EmployeeProject(
                employee_id=employee_id,
                project_id=project.project_id
            )
            session.add(assignment)
            session.commit()

        return jsonify({
            "message": f"Successfully assigned {employee.name} to project '{project_title}'",
            "project_id": project.project_id
        }), 200

    except Exception as e:
        session.rollback()
        return jsonify({"error": f"Failed assigning recommendation: {str(e)}"}), 500
    finally:
        session.close()
