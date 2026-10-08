from fastapi import FastAPI

from database import Base, engine
import models  # noqa: F401  (importing registers the tables on Base)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Zoom Clone API")


@app.get("/")
def health_check():
    return {"status": "ok"}