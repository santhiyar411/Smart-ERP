from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class RecommendedProject(Base):
    __tablename__ = "recommended_projects"

    recommendation_id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id", ondelete="CASCADE"), nullable=False)
    project_title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    required_skills = Column(Text, nullable=True)
    difficulty = Column(String(50), nullable=True)
    recommendation_score = Column(Integer, nullable=True) # match percentage

    employee = relationship("Employee")

    def __repr__(self):
        return f"<RecommendedProject(recommendation_id={self.recommendation_id}, title='{self.project_title}', score={self.recommendation_score})>"
