import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:santhiya4116@127.0.0.1:5432/erpdb")

def get_engine():
    db_url = DATABASE_URL
    if db_url:
        try:
            engine = create_engine(db_url, pool_pre_ping=True)
            with engine.connect() as conn:
                pass
            print(f"Connected to PostgreSQL: {db_url}")
            return engine
        except Exception as e:
            print(f"PostgreSQL connection failed: {e}. Falling back to SQLite.")
    
    sqlite_url = os.getenv("SQLITE_URL", "sqlite:///erp.db")
    print(f"Using SQLite database: {sqlite_url}")
    return create_engine(sqlite_url)

engine = get_engine()
SessionLocal = sessionmaker(bind=engine)
