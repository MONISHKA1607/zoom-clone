from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./zoom_clone.db"

# check_same_thread=False: SQLite normally allows only the thread that created
# the connection to use it. FastAPI handles requests across threads, so we relax it.
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# A "session" is one conversation with the database (queries + a transaction).
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Every model class inherits from Base so SQLAlchemy can track the tables.
Base = declarative_base()


def get_db():
    """FastAPI dependency: open a session per request, always close it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()