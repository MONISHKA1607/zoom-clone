import os
from typing import List

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import crud
import models  # noqa: F401  (registers tables on Base)
import schemas
from database import Base, engine, get_db
from seed import seed_database

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(title="Zoom Clone API")

# CORS: the browser blocks the frontend (port 3000) from calling the API
# (port 8000) unless the API explicitly allows that origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Central error handling: crud errors -> HTTP responses ----------

@app.exception_handler(crud.MeetingNotFoundError)
async def meeting_not_found_handler(request: Request, exc: crud.MeetingNotFoundError):
    return JSONResponse(status_code=404, content={"detail": "Meeting not found"})


@app.exception_handler(crud.MeetingEndedError)
async def meeting_ended_handler(request: Request, exc: crud.MeetingEndedError):
    return JSONResponse(status_code=410, content={"detail": "This meeting has ended"})


@app.exception_handler(crud.ParticipantNotFoundError)
async def participant_not_found_handler(request: Request, exc: crud.ParticipantNotFoundError):
    return JSONResponse(status_code=404, content={"detail": "Participant not found"})


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})

@app.exception_handler(crud.NotAllowedError)
async def not_allowed_handler(request: Request, exc: crud.NotAllowedError):
    return JSONResponse(status_code=403, content={"detail": str(exc)})

# ---------- Helper ----------

def to_meeting_out(meeting: models.Meeting) -> schemas.MeetingOut:
    out = schemas.MeetingOut.model_validate(meeting)
    out.invite_link = f"{FRONTEND_URL}/meeting/{meeting.meeting_code}"
    out.host_name = meeting.host.name
    return out


# ---------- Routes ----------

@app.get("/")
def health_check():
    return {"status": "ok"}


# NOTE: /meetings/upcoming and /meetings/recent MUST be declared before
# /meetings/{code}, otherwise "upcoming" would be treated as a meeting code.

@app.get("/meetings/upcoming", response_model=List[schemas.MeetingOut])
def list_upcoming(db: Session = Depends(get_db)):
    return [to_meeting_out(m) for m in crud.get_upcoming_meetings(db)]


@app.get("/meetings/recent", response_model=List[schemas.MeetingOut])
def list_recent(db: Session = Depends(get_db)):
    return [to_meeting_out(m) for m in crud.get_recent_meetings(db)]


@app.post("/meetings/instant", response_model=schemas.JoinResponse, status_code=201)
def create_instant(
    payload: schemas.InstantMeetingRequest = schemas.InstantMeetingRequest(),
    db: Session = Depends(get_db),
):
    meeting, participant = crud.create_instant_meeting(db, payload.title)
    return schemas.JoinResponse(meeting=to_meeting_out(meeting), participant=participant)


@app.post("/meetings/schedule", response_model=schemas.MeetingOut, status_code=201)
def schedule_meeting(payload: schemas.ScheduleMeetingRequest, db: Session = Depends(get_db)):
    return to_meeting_out(crud.create_scheduled_meeting(db, payload))


@app.get("/meetings/{code}", response_model=schemas.MeetingOut)
def get_meeting(code: str, db: Session = Depends(get_db)):
    meeting = crud.get_meeting_by_code(db, code)
    if meeting is None:
        raise crud.MeetingNotFoundError()
    return to_meeting_out(meeting)


@app.post("/meetings/{code}/join", response_model=schemas.JoinResponse)
def join_meeting(code: str, payload: schemas.JoinRequest, db: Session = Depends(get_db)):
    meeting, participant = crud.join_meeting(db, code, payload.display_name, payload.user_id)
    return schemas.JoinResponse(meeting=to_meeting_out(meeting), participant=participant)


@app.post("/meetings/{code}/leave")
def leave_meeting(code: str, payload: schemas.LeaveRequest, db: Session = Depends(get_db)):
    crud.leave_meeting(db, code, payload.participant_id, payload.end_for_all)
    return {"status": "left"}

@app.post("/meetings/{code}/participants/{participant_id}/remove")
def remove_participant(
    code: str,
    participant_id: int,
    payload: schemas.RemoveRequest,
    db: Session = Depends(get_db),
):
    crud.remove_participant(db, code, participant_id, payload.requester_id)
    return {"status": "removed"}

@app.get("/meetings/{code}/participants", response_model=List[schemas.ParticipantOut])
def list_participants(code: str, db: Session = Depends(get_db)):
    return crud.get_active_participants(db, code)

