import re
import secrets
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas


# ---------- Custom errors (main.py turns these into HTTP responses) ----------

class MeetingNotFoundError(Exception):
    pass


class MeetingEndedError(Exception):
    pass


class ParticipantNotFoundError(Exception):
    pass


# ---------- Helpers ----------

def utcnow_naive() -> datetime:
    """Current UTC time without tzinfo, matching how SQLite stores datetimes."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def normalize_code(raw: str) -> str:
    """Accept '1234567890' or '123-456-7890' (or with spaces) -> '123-456-7890'."""
    digits = re.sub(r"\D", "", raw)
    if len(digits) != 10:
        return raw.strip()
    return f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"


def generate_meeting_code(db: Session) -> str:
    """Random 10-digit code like 123-456-7890; retry until it's unused."""
    while True:
        digits = "".join(secrets.choice("0123456789") for _ in range(10))
        code = f"{digits[:3]}-{digits[3:6]}-{digits[6:]}"
        exists = db.query(models.Meeting).filter(models.Meeting.meeting_code == code).first()
        if not exists:
            return code


def get_default_user(db: Session) -> models.User:
    """No auth: the seeded user is always 'logged in'."""
    return db.query(models.User).first()


def get_meeting_by_code(db: Session, code: str):
    return (
        db.query(models.Meeting)
        .filter(models.Meeting.meeting_code == normalize_code(code))
        .first()
    )


# ---------- Dashboard lists ----------

def get_upcoming_meetings(db: Session):
    return (
        db.query(models.Meeting)
        .filter(
            models.Meeting.type == "scheduled",
            models.Meeting.status == "scheduled",
            models.Meeting.scheduled_start >= utcnow_naive(),
        )
        .order_by(models.Meeting.scheduled_start.asc())
        .all()
    )


def get_recent_meetings(db: Session, limit: int = 10):
    # Instant meetings have no scheduled_start, so fall back to created_at.
    when = func.coalesce(models.Meeting.scheduled_start, models.Meeting.created_at)
    return (
        db.query(models.Meeting)
        .filter(models.Meeting.status == "ended")
        .order_by(when.desc())
        .limit(limit)
        .all()
    )


# ---------- Creating meetings ----------

def create_instant_meeting(db: Session, title: str):
    host = get_default_user(db)

    meeting = models.Meeting(
        meeting_code=generate_meeting_code(db),
        title=title,
        host_id=host.id,
        type="instant",
        status="active",
    )
    db.add(meeting)
    db.flush()  # get meeting.id for the participant row

    participant = models.Participant(
        meeting_id=meeting.id,
        user_id=host.id,
        display_name=host.name,
        role="host",
    )
    db.add(participant)
    db.commit()
    db.refresh(meeting)
    db.refresh(participant)
    return meeting, participant


def create_scheduled_meeting(db: Session, data: schemas.ScheduleMeetingRequest):
    start = data.scheduled_at
    # Convert to naive UTC for storage (naive input is assumed to already be UTC).
    if start.tzinfo is not None:
        start = start.astimezone(timezone.utc).replace(tzinfo=None)

    if start <= utcnow_naive():
        raise ValueError("Meeting must be scheduled for a future time")

    host = get_default_user(db)
    meeting = models.Meeting(
        meeting_code=generate_meeting_code(db),
        title=data.title,
        description=data.description,
        host_id=host.id,
        type="scheduled",
        scheduled_start=start,
        duration_minutes=data.duration_minutes,
        status="scheduled",
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


# ---------- Joining and leaving ----------

def join_meeting(db: Session, code: str, display_name: str, user_id):
    meeting = get_meeting_by_code(db, code)
    if meeting is None:
        raise MeetingNotFoundError()
    if meeting.status == "ended":
        raise MeetingEndedError()

    is_host = user_id is not None and user_id == meeting.host_id
    participant = models.Participant(
        meeting_id=meeting.id,
        user_id=meeting.host_id if is_host else None,
        display_name=display_name.strip(),
        role="host" if is_host else "participant",
    )
    db.add(participant)
    meeting.status = "active"  # first join starts the meeting
    db.commit()
    db.refresh(meeting)
    db.refresh(participant)
    return meeting, participant


def leave_meeting(db: Session, code: str, participant_id: int):
    meeting = get_meeting_by_code(db, code)
    if meeting is None:
        raise MeetingNotFoundError()

    participant = db.get(models.Participant, participant_id)
    if participant is None or participant.meeting_id != meeting.id:
        raise ParticipantNotFoundError()

    now = utcnow_naive()
    if participant.left_at is None:
        participant.left_at = now

    # Host leaving ends the meeting for everyone.
    if participant.role == "host":
        meeting.status = "ended"
        for p in meeting.participants:
            if p.left_at is None:
                p.left_at = now

    db.commit()


def get_active_participants(db: Session, code: str):
    meeting = get_meeting_by_code(db, code)
    if meeting is None:
        raise MeetingNotFoundError()
    return (
        db.query(models.Participant)
        .filter(
            models.Participant.meeting_id == meeting.id,
            models.Participant.left_at.is_(None),
        )
        .order_by(models.Participant.joined_at.asc())
        .all()
    )