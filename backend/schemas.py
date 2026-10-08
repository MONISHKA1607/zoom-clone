from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer


def as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """SQLite returns naive datetimes. We always store UTC, so tag them as UTC
    before sending, so the browser can convert to the user's local time."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


# ---------- Request bodies (what the frontend sends) ----------

class InstantMeetingRequest(BaseModel):
    title: str = Field(default="Instant Meeting", min_length=1, max_length=100)


class ScheduleMeetingRequest(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    scheduled_at: datetime
    duration_minutes: int = Field(gt=0, le=1440)  # 1 minute to 24 hours


class JoinRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=50)
    user_id: Optional[int] = None  # only set when the default user starts their own meeting


class LeaveRequest(BaseModel):
    participant_id: int


# ---------- Response bodies (what the API returns) ----------

class ParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_id: int
    user_id: Optional[int]
    display_name: str
    role: str
    joined_at: datetime
    left_at: Optional[datetime]

    @field_serializer("joined_at", "left_at")
    def serialize_dates(self, value):
        return as_utc(value)


class MeetingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    meeting_code: str
    title: str
    description: Optional[str]
    host_id: int
    type: str
    scheduled_start: Optional[datetime]
    duration_minutes: Optional[int]
    status: str
    created_at: datetime
    invite_link: Optional[str] = None  # not a DB column; filled in by the route
    host_name: Optional[str] = None  # filled in by the route from meeting.host.name

    @field_serializer("scheduled_start", "created_at")
    def serialize_dates(self, value):
        return as_utc(value)


class JoinResponse(BaseModel):
    meeting: MeetingOut
    participant: ParticipantOut