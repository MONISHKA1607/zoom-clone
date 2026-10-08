from fastapi import FastAPI

from database import Base, engine
import models  # noqa: F401
from seed import seed_database

Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(title="Zoom Clone API")


@app.get("/")
def health_check():
    return {"status": "ok"}