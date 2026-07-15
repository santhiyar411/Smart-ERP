from flask import Blueprint, jsonify, request
from uuid import uuid4
from sqlalchemy.exc import IntegrityError

from models.employee import Employee
from database import SessionLocal
from routes.auth_route import token_required, role_required

employee_bp = Blueprint("employee_bp", __name__, url_prefix="/employees")

def serialize_employee(employee):
    return {
        "id": employee.employee_id,
        "employee_code": employee.employee_code,
        "name": employee.name,
        "email": employee.email,
        "phone": employee.phone,
        "department": employee.department,
        "designation": employee.designation,
        "joining_date": employee.joining_date,
    }

@employee_bp.route("", methods=["GET"])
@token_required
@role_required(["Admin", "HR"])
def list_employees():
    session = SessionLocal()
    try:
        employees = session.query(Employee).all()
        return jsonify([serialize_employee(e) for e in employees]), 200
    finally:
        session.close()

@employee_bp.route("", methods=["POST"])
@token_required
@role_required(["Admin", "HR"])
def create_employee():
    data = request.get_json(silent=True) or {}
    
    name = data.get("name")
    email = data.get("email")
    if not name or not email:
        return jsonify({"error": "name and email are required"}), 400

    session = SessionLocal()
    try:
        employee = Employee(
            employee_code=data.get("employee_code", f"EMP{uuid4().hex[:6].upper()}"),
            name=name,
            email=email,
            phone=data.get("phone"),
            department=data.get("department"),
            designation=data.get("designation"),
            joining_date=data.get("joining_date"),
        )
        session.add(employee)
        session.commit()
        session.refresh(employee)
        return jsonify(serialize_employee(employee)), 201
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Employee Code or Email already registered"}), 400
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()

@employee_bp.route("/<int:employee_id>", methods=["PUT"])
@token_required
@role_required(["Admin", "HR"])
def update_employee(employee_id):
    data = request.get_json(silent=True) or {}
    
    session = SessionLocal()
    try:
        employee = session.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            return jsonify({"error": "Employee not found"}), 404

        if "employee_code" in data:
            employee.employee_code = data["employee_code"]
        if "name" in data:
            employee.name = data["name"]
        if "email" in data:
            employee.email = data["email"]
        if "phone" in data:
            employee.phone = data["phone"]
        if "department" in data:
            employee.department = data["department"]
        if "designation" in data:
            employee.designation = data["designation"]
        if "joining_date" in data:
            employee.joining_date = data["joining_date"]

        session.commit()
        session.refresh(employee)
        return jsonify(serialize_employee(employee)), 200
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Employee Code or Email conflict"}), 400
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()

@employee_bp.route("/<int:employee_id>", methods=["DELETE"])
@token_required
@role_required(["Admin", "HR"])
def delete_employee(employee_id):
    session = SessionLocal()
    try:
        employee = session.query(Employee).filter(Employee.employee_id == employee_id).first()
        if not employee:
            return jsonify({"error": "Employee not found"}), 404

        session.delete(employee)
        session.commit()
        return jsonify({"message": "Employee deleted successfully"}), 200
    except Exception as exc:
        session.rollback()
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()