import { JoinResponse, Meeting } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    // Our own errors send detail as a string; FastAPI's 422 sends an array.
    const message =
      typeof body?.detail === "string" ? body.detail : "Something went wrong";
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

export function leaveMeeting(code: string, participantId: number) {
  return request<{ status: string }>(`/meetings/${code}/leave`, {
    method: "POST",
    body: JSON.stringify({ participant_id: participantId }),
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