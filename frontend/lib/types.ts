export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  description: string | null;
  host_id: number;
  type: "instant" | "scheduled";
  scheduled_start: string | null; // ISO string in UTC, e.g. "2026-10-09T15:00:00+00:00"
  duration_minutes: number | null;
  status: "scheduled" | "active" | "ended";
  created_at: string;
  invite_link: string | null;
  host_name: string | null;
}

export interface Participant {
  id: number;
  meeting_id: number;
  user_id: number | null;
  display_name: string;
  role: "host" | "participant";
  joined_at: string;
  left_at: string | null;
}

export interface JoinResponse {
  meeting: Meeting;
  participant: Participant;
}