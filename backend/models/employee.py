from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .base import Base


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, autoincrement=True)
    employee_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    department = Column(String(100), nullable=True)
    designation = Column(String(200), nullable=True)
    joining_date = Column(String(50), nullable=True)

    documents = relationship("Document", back_populates="employee", cascade="all, delete-orphan")
    skills = relationship("EmployeeSkill", back_populates="employee", cascade="all, delete-orphan")
