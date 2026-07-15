import os
from datetime import datetime, timedelta
from functools import wraps
import bcrypt
import jwt
from flask import Blueprint, jsonify, request
from sqlalchemy.exc import IntegrityError

from models.users import User
from database import SessionLocal

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/auth")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-erp-key-2026")

def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        if auth_header:
            parts = auth_header.split(" ")
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
        
        if not token:
            return jsonify({"error": "Authorization token is missing"}), 401
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            session = SessionLocal()
            try:
                user = session.query(User).filter(User.user_id == payload["user_id"]).first()
                if not user:
                    return jsonify({"error": "User not found"}), 401
                # We store user details in request.environ or request context
                request.current_user = {
                    "user_id": user.user_id,
                    "email": user.email,
                    "role": user.role,
                    "full_name": user.full_name,
                    "department": user.department,
                }
            finally:
                session.close()
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
            
        return f(*args, **kwargs)
    return decorated

@auth_bp.route("/register", methods=["POST"])
def register():
    payload = request.get_json(silent=True) or {}
    
    email = payload.get("email")
    password = payload.get("password")
    full_name = payload.get("full_name")
    role = payload.get("role", "Employee")
    department = payload.get("department")
    employee_id = payload.get("employee_id")
    
    if not email or not password or not full_name:
        return jsonify({"error": "email, password, and full_name are required"}), 400
        
    pw_hash = hash_password(password)
    
    session = SessionLocal()
    try:
        user = User(
            email=email,
            password_hash=pw_hash,
            full_name=full_name,
            role=role,
            department=department,
            employee_id=employee_id
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return jsonify({
            "message": "User registered successfully",
            "user": {
                "user_id": user.user_id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            }
        }), 201
    except IntegrityError:
        session.rollback()
        return jsonify({"error": "Email or Employee ID already registered"}), 400
    finally:
        session.close()

@auth_bp.route("/login", methods=["POST"])
def login():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    password = payload.get("password")
    
    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400
        
    session = SessionLocal()
    try:
        user = session.query(User).filter(User.email == email).first()
        if not user or not check_password(password, user.password_hash):
            return jsonify({"error": "Invalid email or password"}), 401
            
        token = jwt.encode({
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role,
            "exp": datetime.utcnow() + timedelta(days=1)
        }, JWT_SECRET, algorithm="HS256")
        
        return jsonify({
            "token": token,
            "user": {
                "user_id": user.user_id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "department": user.department,
                "employee_id": user.employee_id
            }
        }), 200
    finally:
        session.close()

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me():
    return jsonify({"user": request.current_user}), 200

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, "current_user") or not request.current_user:
                return jsonify({"error": "Unauthorized"}), 401
            if request.current_user["role"] not in roles:
                return jsonify({"error": "Access forbidden: insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

