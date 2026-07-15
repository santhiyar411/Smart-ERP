from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    skill_id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="CASCADE"), nullable=False)
    skill_name = Column(String(100), nullable=False)
    proficiency_score = Column(Integer, default=1) # 1 to 5 or percentage

    employee = relationship("Employee", back_populates="skills")
