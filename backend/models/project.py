from sqlalchemy import Column, Integer, String, Text

from .base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    project_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default="ACTIVE")
    start_date = Column(String(50), nullable=True)
    end_date = Column(String(50), nullable=True)
    assigned_employee_ids = Column(String(500), nullable=True, default="[]")

    def __repr__(self):
        return f"<Project(id={self.id}, project_name='{self.project_name}')>"