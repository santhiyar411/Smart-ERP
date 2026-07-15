from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class ProjectRequirement(Base):
    __tablename__ = "project_requirements"

    requirement_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=False)
    required_skill = Column(String(100), nullable=False)
    priority_level = Column(String(50), nullable=False, default="Medium") # High, Medium, Low

    project = relationship("Project", back_populates="requirements")
