from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# For SQLite Cloud or local SQLite
if settings.SQLITE_CLOUD_CONNECTION_STRING:
    # SQLite Cloud URL should start with sqlitecloud://
    engine = create_engine(settings.SQLITE_CLOUD_CONNECTION_STRING)
else:
    # For SQLite, we need to allow multi-threaded access
    engine = create_engine(
        settings.DATABASE_URL, connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
