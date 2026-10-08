import type { Participant } from "./types";

// One entry per meeting, so several tabs can be in different meetings.
const keyFor = (code: string) => `participant:${code}`;

export function saveParticipant(code: string, participant: Participant) {
  try {
    sessionStorage.setItem(keyFor(code), JSON.stringify(participant));
  } catch {
    // Storage can be blocked (e.g. private mode); the room will just ask to rejoin.
  }
}

export function loadParticipant(code: string): Participant | null {
  try {
    const raw = sessionStorage.getItem(keyFor(code));
    return raw ? (JSON.parse(raw) as Participant) : null;
  } catch {
    return null;
  }
}

export function clearParticipant(code: string) {
  try {
    sessionStorage.removeItem(keyFor(code));
  } catch {
    // ignore
  }
}