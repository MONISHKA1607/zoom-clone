from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    hosted_meetings = relationship("Meeting", back_populates="host")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    meeting_code = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)              # "instant" | "scheduled"
    scheduled_start = Column(DateTime, nullable=True)  # null for instant meetings
    duration_minutes = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="scheduled")  # scheduled | active | ended
    created_at = Column(DateTime, default=utcnow)

    host = relationship("User", back_populates="hosted_meetings")
    participants = relationship(
        "Participant", back_populates="meeting", cascade="all, delete-orphan"
    )


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # null = guest
    display_name = Column(String, nullable=False)
    role = Column(String, nullable=False, default="participant")  # host | participant
    joined_at = Column(DateTime, default=utcnow)
    left_at = Column(DateTime, nullable=True)

    meeting = relationship("Meeting", back_populates="participants")