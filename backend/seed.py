from datetime import datetime, timedelta, timezone

from database import Base, SessionLocal, engine
from models import Meeting, Participant, User


def top_of_next_hour(moment: datetime) -> datetime:
    """14:23 -> 15:00, so seeded meetings start on tidy times."""
    return moment.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)


def add_attendees(db, meeting: Meeting, host: User, guest_names: list[str]):
    """Give an ended meeting a host plus a few guests, so the history looks real."""
    start = meeting.scheduled_start
    end = start + timedelta(minutes=meeting.duration_minutes)

    db.add(
        Participant(
            meeting_id=meeting.id,
            user_id=host.id,
            display_name=host.name,
            role="host",
            joined_at=start,
            left_at=end,
        )
    )
    for minutes_late, name in enumerate(guest_names, start=1):
        db.add(
            Participant(
                meeting_id=meeting.id,
                user_id=None,  # guests have no account
                display_name=name,
                role="participant",
                joined_at=start + timedelta(minutes=minutes_late),
                left_at=end - timedelta(minutes=minutes_late),
            )
        )


def seed_database():
    """Insert a small demo data set, but only if the database is empty (idempotent)."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Guard: if a user exists we've already seeded, so do nothing.
        if db.query(User).first():
            return

        base = top_of_next_hour(datetime.now(timezone.utc))

        # The default "logged-in" user (the assignment says no auth needed).
        host = User(name="Monishka Mittal", email="monishka@example.com", avatar=None)
        db.add(host)
        db.flush()  # sends the INSERT now so host.id is populated, without committing

        upcoming = [
            Meeting(
                meeting_code="123-456-7890",
                title="Team Standup",
                description="Daily sync on progress and blockers",
                host_id=host.id,
                type="scheduled",
                scheduled_start=base + timedelta(days=1),
                duration_minutes=30,
                status="scheduled",
            ),
            Meeting(
                meeting_code="234-567-8901",
                title="Project Planning",
                description="Plan the next sprint and assign tasks",
                host_id=host.id,
                type="scheduled",
                scheduled_start=base + timedelta(days=3),
                duration_minutes=60,
                status="scheduled",
            ),
        ]

        past_discussion = Meeting(
            meeting_code="345-678-9012",
            title="Project Discussion",
            description="Walkthrough of the project requirements",
            host_id=host.id,
            type="scheduled",
            scheduled_start=base - timedelta(days=1),
            duration_minutes=45,
            status="ended",
            created_at=base - timedelta(days=2),
        )
        past_review = Meeting(
            meeting_code="456-789-0123",
            title="Design Review",
            description="Review of the dashboard designs",
            host_id=host.id,
            type="scheduled",
            scheduled_start=base - timedelta(days=3),
            duration_minutes=60,
            status="ended",
            created_at=base - timedelta(days=4),
        )

        db.add_all(upcoming + [past_discussion, past_review])
        db.flush()  # assigns meeting ids, needed for the participant rows

        add_attendees(db, past_discussion, host, ["Aarav Sharma", "Priya Singh"])
        add_attendees(db, past_review, host, ["Aarav Sharma"])

        db.commit()
        print("Database seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()