"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { getMeeting } from "@/lib/api";
import { extractMeetingCode } from "@/lib/meetingCode";
import Modal from "./Modal";

export default function JoinModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // stop the browser's default full-page form submit

    const code = extractMeetingCode(value);
    if (!code) {
      setError("Enter a valid 10-digit meeting ID or invite link.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const meeting = await getMeeting(code); // 404 -> "Meeting not found"
      if (meeting.status === "ended") {
        setError("This meeting has ended.");
        setLoading(false);
        return;
      }
      router.push(`/meeting/${meeting.meeting_code}`);
      // Leave `loading` true: we're navigating away.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't find that meeting.");
      setLoading(false);
    }
  }

  return (
    <Modal title="Join meeting" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="meeting-id" className="mb-1 block text-sm font-bold">
            Meeting ID or invite link
          </label>
          <input
            id="meeting-id"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="123-456-7890"
            className="w-full rounded-lg border border-zoom-border px-3 py-2 outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/30"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-bold text-zoom-muted hover:bg-zoom-bg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="rounded-lg bg-zoom-blue px-5 py-2 text-sm font-bold text-white hover:bg-zoom-blue-dark disabled:opacity-60"
          >
            {loading ? "Checking..." : "Join"}
          </button>
        </div>
      </form>
    </Modal>
  );
}