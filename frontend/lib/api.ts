import { JoinResponse, Meeting, Participant, ScheduleInput } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    let message = "Something went wrong";
    if (typeof body?.detail === "string") {
      message = body.detail; // our own errors (404, 410, 400)
    } else if (Array.isArray(body?.detail) && body.detail[0]?.msg) {
      // Pydantic validation errors (422): show the first one, minus its prefix
      message = String(body.detail[0].msg).replace(/^Value error, /, "");
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function getUpcomingMeetings() {
  return request<Meeting[]>("/meetings/upcoming");
}

export function getRecentMeetings() {
  return request<Meeting[]>("/meetings/recent");
}

export function createInstantMeeting() {
  return request<JoinResponse>("/meetings/instant", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function getMeeting(code: string) {
  return request<Meeting>(`/meetings/${code}`);
}

export function leaveMeeting(code: string, participantId: number, endForAll = false) {
  return request<{ status: string }>(`/meetings/${code}/leave`, {
    method: "POST",
    body: JSON.stringify({ participant_id: participantId, end_for_all: endForAll }),
  });
}

export function joinMeeting(
  code: string,
  displayName: string,
  userId: number | null = null
) {
  return request<JoinResponse>(`/meetings/${code}/join`, {
    method: "POST",
    body: JSON.stringify({ display_name: displayName, user_id: userId }),
  });
}

export function scheduleMeeting(input: ScheduleInput) {
  return request<Meeting>("/meetings/schedule", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getParticipants(code: string) {
  return request<Participant[]>(`/meetings/${code}/participants`);
}