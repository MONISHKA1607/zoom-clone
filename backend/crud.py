import re
import secrets
from datetime import datetime, timedelta, timezone

# from sqlalchemy import func
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

class NotAllowedError(Exception):
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

def scheduled_end(meeting: models.Meeting) -> datetime:
    """When a scheduled meeting's time slot finishes (start + duration)."""
    return meeting.scheduled_start + timedelta(minutes=meeting.duration_minutes or 0)


def get_upcoming_meetings(db: Session):
    """Scheduled meetings that are in progress, or whose time slot hasn't finished."""
    now = utcnow_naive()
    candidates = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.type == "scheduled",
            models.Meeting.status != "ended",
            models.Meeting.scheduled_start.isnot(None),
        )
        .order_by(models.Meeting.scheduled_start.asc())
        .all()
    )
    # The end time is start + duration, which is simplest to compute in Python.
    return [m for m in candidates if m.status == "active" or scheduled_end(m) >= now]


def get_recent_meetings(db: Session, limit: int = 10):
    """Ended meetings, plus scheduled ones nobody started before their slot ran out."""
    now = utcnow_naive()
    ended = db.query(models.Meeting).filter(models.Meeting.status == "ended").all()

    never_started = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.type == "scheduled",
            models.Meeting.status == "scheduled",
            models.Meeting.scheduled_start.isnot(None),
        )
        .all()
    )
    missed = [m for m in never_started if scheduled_end(m) < now]

    combined = ended + missed
    # Instant meetings have no scheduled_start, so fall back to created_at.
    combined.sort(key=lambda m: m.scheduled_start or m.created_at, reverse=True)
    return combined[:limit]


# ---------- Creating meetings ----------

def create_instant_meeting(db: Session, title: str):
    host = get_default_user(db)

    meeting = models.Meeting(
        meeting_code=generate_meeting_code(db),
        title=title or f"{host.name}'s Zoom Meeting",
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


def leave_meeting(db: Session, code: str, participant_id: int, end_for_all: bool = False):
    meeting = get_meeting_by_code(db, code)
    if meeting is None:
        raise MeetingNotFoundError()

    participant = db.get(models.Participant, participant_id)
    if participant is None or participant.meeting_id != meeting.id:
        raise ParticipantNotFoundError()

    if participant.left_at is not None:
        return  # already left, so nothing to do (also stops a stale host promoting twice)

    now = utcnow_naive()
    participant.left_at = now

    if participant.role == "host":
        # Everyone still in the meeting, in the order they joined.
        remaining = sorted(
            (p for p in meeting.participants if p.left_at is None),
            key=lambda p: p.joined_at,
        )
        if end_for_all or not remaining:
            # Close the meeting for everyone (or the last person just left).
            meeting.status = "ended"
            for p in remaining:
                p.left_at = now
        else:
            # Host leaves but others stay: hand the host role to whoever joined first.
            remaining[0].role = "host"

    db.commit()

def remove_participant(db: Session, code: str, target_id: int, requester_id: int):
    meeting = get_meeting_by_code(db, code)
    if meeting is None:
        raise MeetingNotFoundError()

    # The person asking must be someone currently in THIS meeting...
    requester = db.get(models.Participant, requester_id)
    if (
        requester is None
        or requester.meeting_id != meeting.id
        or requester.left_at is not None
    ):
        raise ParticipantNotFoundError()
    # ...and must be a host. This check is the authorization.
    if requester.role != "host":
        raise NotAllowedError("Only the host can remove participants")

    target = db.get(models.Participant, target_id)
    if target is None or target.meeting_id != meeting.id:
        raise ParticipantNotFoundError()
    if target.role == "host":
        raise NotAllowedError("A host can't be removed")

    if target.left_at is None:  # already gone? then there's nothing to do
        target.left_at = utcnow_naive()
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