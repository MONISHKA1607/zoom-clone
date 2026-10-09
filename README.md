# Zoom Clone

A full-stack video-meeting web app modelled on Zoom's web interface. Start an instant meeting, join one with an ID or invite link, schedule meetings for later, and share a meeting room with other people.

**Live demo:** https://zoom-clone-eta-bice.vercel.app &nbsp;|&nbsp; **API docs:** https://zoom-clone-backend-wqtk.onrender.com/docs

> The backend runs on a free hosting tier that goes to sleep when idle. The first request after a quiet period can take up to a minute while it wakes up.

## Try it in two minutes

1. Open the app and click **New meeting**, then **Use microphone and camera** (or continue without).
2. Click the **ⓘ** icon in the room header and **Copy link**.
3. Paste the link into a second browser window (incognito works well), enter a name, and join.
4. In the first window, open **Participants**. Both people are listed, and the host can remove guests.
5. Back on the dashboard, click **Schedule**, fill in the form, and see the meeting appear under **Upcoming**.
6. Click **Join** and enter the demo meeting ID `123-456-7890`.
7. As host, click **End → End Meeting for All**. The meeting moves to **Recent**.

## Features

- **Dashboard** with a live clock, New meeting / Join / Schedule actions, and Upcoming and Recent meeting lists
- **Instant meeting**: a unique meeting ID and shareable invite link are generated, and you land in the room
- **Join meeting**: enter an ID (`1234567890` or `123-456-7890`) or paste a full invite link; the meeting is validated before you join, and you choose a display name
- **Schedule meeting**: title, description, date, time and duration, with a generated invite link, saved to the database and shown under Upcoming
- **Meeting room**: your own camera via the browser, mic and video toggles, participants panel, and a live participant list that refreshes every 3 seconds
- **Host controls**: remove a participant, leave while keeping the meeting open (the host role passes to the longest-present participant), or end the meeting for everyone
- **Responsive layout** for desktop and phone widths

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| Database | SQLite |
| Hosting | Vercel (frontend), Render (backend) |

## Architecture

```
Browser (Next.js)  ──REST/JSON──▶  FastAPI  ──SQLAlchemy──▶  SQLite
 pages, components     lib/api.ts   routes → crud → models      zoom_clone.db
```

- **Frontend**: pages and components only. All network calls go through `lib/api.ts`, and its types mirror the API's response schemas.
- **Backend**: a request goes route (`main.py`), then validation (`schemas.py`), then database logic (`crud.py`), then response. Business rules live in `crud.py`, and routes stay thin.

## Getting started

Requires Node.js 20+ and Python 3.10+.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The first start creates `zoom_clone.db` and fills it with a small demo data set. To start over, stop the server, delete `zoom_clone.db`, and start it again. Interactive API docs are at http://localhost:8000/docs.

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | frontend | Base URL of the backend (no trailing slash) |
| `FRONTEND_URL` | backend | Allowed CORS origin, and the base of generated invite links. Defaults to `http://localhost:3000` |

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/meetings/upcoming` | Scheduled meetings that are in progress or not yet finished |
| GET | `/meetings/recent` | Ended meetings, plus scheduled ones that were never started |
| POST | `/meetings/instant` | Create an instant meeting; returns the meeting and the host participant |
| POST | `/meetings/schedule` | Schedule a meeting for a future time |
| GET | `/meetings/{code}` | Look up (validate) a meeting by ID |
| POST | `/meetings/{code}/join` | Join with a display name |
| POST | `/meetings/{code}/leave` | Leave; the host can optionally end the meeting for all |
| GET | `/meetings/{code}/participants` | People currently in the meeting |
| POST | `/meetings/{code}/participants/{id}/remove` | Host removes a participant |

Errors use standard status codes: 404 not found, 410 meeting ended, 400 business-rule violation, 403 not allowed, 422 invalid input.

## Database schema

```
users 1 ──< meetings 1 ──< participants
```

- **users**: `id`, `name`, `email` (unique), `avatar`, `created_at`
- **meetings**: `id`, `meeting_code` (unique, indexed), `title`, `description`, `host_id` → users, `type` (`instant` or `scheduled`), `scheduled_start`, `duration_minutes`, `status` (`scheduled`, `active` or `ended`), `created_at`
- **participants**: `id`, `meeting_id` → meetings, `user_id` → users (nullable), `display_name`, `role` (`host` or `participant`), `joined_at`, `left_at` (null while still in the meeting)

`participants.user_id` is nullable because there is no sign-in: anyone joining with a display name is a guest.

## Design decisions and assumptions

- **No authentication**, as specified. One default user is seeded and acts as the host of every meeting created in the app.
- **Host identity**: the host's browser starts the meeting with the host's user ID, and the server checks that against the meeting. Without real authentication this can be spoofed; with it, the ID would come from a verified session.
- **Times are stored in UTC** and converted to the viewer's local time in the browser.
- **Upcoming** shows scheduled meetings that are in progress or whose time slot hasn't finished. **Recent** shows ended meetings, plus scheduled ones that nobody started before their slot ran out (tagged "Not started").
- **Polling instead of WebSockets**: the room asks the server for the participant list every 3 seconds. This is simple and works on any host. WebSockets would make updates instant.
- **Demo data is created in code** (`seed.py`) and only when the database is empty, so the app is never blank on a fresh deploy.
- **Authorization is enforced on the server**: for example, only a host in the same meeting can remove a participant, whatever the interface shows.

## Known limitations

- **No real audio or video between people.** Your own camera preview works via `getUserMedia`, other participants appear as avatar tiles, and the mic button only changes the interface. Real calls would use WebRTC, with a signaling channel (WebSockets) and STUN/TURN servers.
- **Closing a tab without clicking Leave** leaves that participant listed. A heartbeat with server-side expiry would fix this.
- **A removed guest can rejoin** with the invite link; there is no ban list.
- **Decorative controls** (search, Chat, Contacts, React, Share, Breakout Rooms, More, and similar) match Zoom's layout but are not functional.
- **Free hosting**: the backend sleeps when idle, and its SQLite file is not kept across restarts or redeploys, so the demo data is recreated each time. Meetings created during a visit may disappear after a restart.

## Project structure

```
zoom-clone/
├── backend/
│   ├── main.py          # routes, CORS, error handlers
│   ├── database.py      # engine, session factory, get_db dependency
│   ├── models.py        # SQLAlchemy tables
│   ├── schemas.py       # Pydantic request and response models
│   ├── crud.py          # database operations and business rules
│   ├── seed.py          # idempotent demo data
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── page.tsx                      # dashboard
    │   └── meeting/[code]/               # meeting page (page.tsx, MeetingRoom.tsx)
    ├── components/                       # AppShell, Navbar, Sidebar, MeetingCard, modals, PreJoin
    │   └── room/                         # Room, RoomHeader, Stage, ParticipantTile, ControlBar, ParticipantsPanel, Toast
    └── lib/                              # api, types, format, session, meetingCode, avatar, useCamera
```