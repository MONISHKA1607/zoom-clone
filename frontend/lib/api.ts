import { Meeting } from "./types";

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