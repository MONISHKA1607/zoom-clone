from datetime import datetime, timedelta, timezone

from database import Base, SessionLocal, engine
from models import Meeting, Participant, User


def seed_database():
    """Insert sample data, but only if the database is empty (idempotent)."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Guard: if a user exists we've already seeded, so do nothing.
        if db.query(User).first():
            return

        now = datetime.now(timezone.utc)

        # The default "logged-in" user (the assignment says no auth needed).
        user = User(
            name="Monishka Mittal",
            email="monishka@example.com",
            avatar=None,
        )
        db.add(user)
        db.flush()  # sends the INSERT now so user.id is populated, without committing

        meetings = [
            # --- Upcoming (scheduled in the future) ---
            Meeting(
                meeting_code="123-456-7890",
                title="Weekly Team Sync",
                description="Status updates and blockers",
                host_id=user.id,
                type="scheduled",
                scheduled_start=now + timedelta(days=1, hours=2),
                duration_minutes=60,
                status="scheduled",
            ),
            Meeting(
                meeting_code="234-567-8901",
                title="Project Kickoff",
                description="Kickoff for the new client project",
                host_id=user.id,
                type="scheduled",
                scheduled_start=now + timedelta(days=2, hours=5),
                duration_minutes=45,
                status="scheduled",
            ),
            Meeting(
                meeting_code="345-678-9012",
                title="Interview Prep Session",
                description="Mock interview practice",
                host_id=user.id,
                type="scheduled",
                scheduled_start=now + timedelta(days=4),
                duration_minutes=30,
                status="scheduled",
            ),
            # --- Recent (already ended) ---
            Meeting(
                meeting_code="456-789-0123",
                title="Design Review",
                description="Reviewing the dashboard mockups",
                host_id=user.id,
                type="scheduled",
                scheduled_start=now - timedelta(days=1),
                duration_minutes=60,
                status="ended",
                created_at=now - timedelta(days=3),
            ),
            Meeting(
                meeting_code="567-890-1234",
                title="Personal Meeting Room",
                description=None,
                host_id=user.id,
                type="instant",
                scheduled_start=None,
                duration_minutes=None,
                status="ended",
                created_at=now - timedelta(days=2),
            ),
            Meeting(
                meeting_code="678-901-2345",
                title="Standup",
                description="Daily standup",
                host_id=user.id,
                type="scheduled",
                scheduled_start=now - timedelta(days=3),
                duration_minutes=15,
                status="ended",
                created_at=now - timedelta(days=5),
            ),
        ]
        db.add_all(meetings)
        db.flush()

        # Participants for the ended meetings: the host plus a couple of guests.
        for meeting in meetings:
            if meeting.status != "ended":
                continue
            start = meeting.scheduled_start or meeting.created_at
            db.add_all([
                Participant(
                    meeting_id=meeting.id,
                    user_id=user.id,
                    display_name=user.name,
                    role="host",
                    joined_at=start,
                    left_at=start + timedelta(minutes=30),
                ),
                Participant(
                    meeting_id=meeting.id,
                    user_id=None,  # guest
                    display_name="Aarav Sharma",
                    role="participant",
                    joined_at=start + timedelta(minutes=2),
                    left_at=start + timedelta(minutes=28),
                ),
                Participant(
                    meeting_id=meeting.id,
                    user_id=None,  # guest
                    display_name="Priya Singh",
                    role="participant",
                    joined_at=start + timedelta(minutes=5),
                    left_at=start + timedelta(minutes=30),
                ),
            ])

        db.commit()
        print("Database seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()