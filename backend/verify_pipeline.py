import os
import sys

# Ensure root of backend is in Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Base, engine
from models.employee import Employee
from models.employee_skills import EmployeeSkill
from models.recommended_projects import RecommendedProject
from services.extraction_service import extract_employee_info
from routes.recommendations_route import generate_and_save_recs_for_employee, PREDEFINED_PROJECTS

def run_verification():
    print("====================================================")
    print("STARTING END-TO-END PIPELINE VERIFICATION")
    print("====================================================")

    # 1. Ensure Table schemas are initialized
    print("[1] Building Database Schemas...")
    Base.metadata.create_all(bind=engine)
    print("Database tables verified.")

    # 2. Test Resume Parsing / Skill Extraction
    print("\n[2] Testing AI Resume Parsing with Mock Resume Text...")
    mock_resume = """
    John Doe
    john.doe@example.com | (555) 019-2834
    
    Education:
    Bachelor of Technology in Computer Science (B.Tech)
    
    Certifications:
    AWS Certified Solutions Architect Associate
    Certified Kubernetes Administrator (CKA)
    
    Professional Experience:
    3 years of software engineering experience developing REST APIs.
    Worked extensively with React frontend frameworks and Node.js backends.
    Deployed microservices using Docker containers.
    
    Skills:
    React, Node.js, Python, Flask, MongoDB, AWS, Docker, Git.
    """

    info = extract_employee_info(mock_resume, source_name="John_Doe_Resume.pdf")
    
    print("Parsed Output Fields:")
    print(f" - Name: {info['name']}")
    print(f" - Email: {info['email']}")
    print(f" - Phone: {info['phone']}")
    print(f" - Degree: {info['degree']}")
    print(f" - Skills: {info['skills']}")
    print(f" - Certifications: {info['certifications']}")
    print(f" - Experience: {info['experience']}")

    # Validate output
    assert info["name"] == "John Doe", "Name extraction failed"
    assert info["email"] == "john.doe@example.com", "Email extraction failed"
    assert "React" in info["skills"], "Skills extraction failed"
    assert "AWS Certified Solutions Architect Associate" in info["certifications"], "Certifications extraction failed"
    print("AI Resume Parsing checks PASSED.")

    # 3. Test Database Sync and Project Recommendation Trigger
    print("\n[3] Testing Database Sync and Recommendations...")
    session = SessionLocal()
    try:
        # Create test employee if not exists
        emp = session.query(Employee).filter(Employee.email == info["email"]).first()
        if not emp:
            emp = Employee(
                name=info["name"],
                email=info["email"],
                phone=info["phone"],
                department="Engineering",
                designation="AI Extracted Profile",
                employee_code="EMP_TEST_123"
            )
            session.add(emp)
            session.commit()
            session.refresh(emp)

        employee_id = emp.employee_id
        print(f"Using employee_id: {employee_id}")

        # Sync skills
        session.query(EmployeeSkill).filter(EmployeeSkill.employee_id == employee_id).delete()
        for idx, skill in enumerate(info["skills"]):
            p_score = 4 if idx % 2 == 0 else 5
            es = EmployeeSkill(
                employee_id=employee_id,
                skill_name=skill,
                proficiency_score=p_score
            )
            session.add(es)
        session.commit()
        print("Employee skills synced to DB successfully.")

        # Calculate recommendations
        generate_and_save_recs_for_employee(employee_id, session)

        # Query database recommendations
        recs = session.query(RecommendedProject).filter(RecommendedProject.employee_id == employee_id).all()
        print(f"Total Recommendations generated: {len(recs)}")

        # Print top recommendation
        recs.sort(key=lambda x: x.recommendation_score, reverse=True)
        print("Top Project Matches:")
        for r in recs[:3]:
            print(f" - Project: {r.project_title} (Match Score: {r.recommendation_score}%)")
            print(f"   Difficulty: {r.difficulty}")
            print(f"   Required: {r.required_skills}")

        assert len(recs) > 0, "No recommendations saved in DB"
        print("AI Recommendations DB Sync checks PASSED.")

    finally:
        session.close()

    print("\n====================================================")
    print("ALL PIPELINE VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("====================================================")

if __name__ == "__main__":
    run_verification()
