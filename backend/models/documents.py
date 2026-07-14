from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base


class Document(Base):
    __tablename__ = "documents"

    document_id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.employee_id"), nullable=True)
    document_type = Column(String(100), default="uploaded_document")
    file_path = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=True)
    upload_date = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="documents")

    def __repr__(self):
        return f"<Document(document_id={self.document_id}, document_type='{self.document_type}')>"