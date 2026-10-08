"use client";

import { Check, Copy } from "lucide-react";
import { useState, type FormEvent } from "react";

import { scheduleMeeting } from "@/lib/api";
import { formatDate, formatFullRange } from "@/lib/format";
import type { Meeting } from "@/lib/types";
import Modal from "./Modal";

const DURATIONS = [15, 30, 45, 60, 90, 120];

const pad = (n: number) => String(n).padStart(2, "0");

// <input type="date"> needs "YYYY-MM-DD" in LOCAL time.
// (toISOString() would give the UTC date, which can be a day off.)
const toDateValue = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// Default start: the next half hour. setMinutes(60) rolls over to the next hour.
function nextHalfHour(): Date {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60);
  return d;
}

interface ScheduleModalProps {
  onClose: () => void;
  onScheduled: () => void; // lets the dashboard refresh its lists
}

export default function ScheduleModal({ onClose, onScheduled }: ScheduleModalProps) {
  // Safe to read the clock here: this modal only renders after a click, in the browser.
  const [defaults] = useState(nextHalfHour);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(toDateValue(defaults));
  const [time, setTime] = useState(toTimeValue(defaults));
  const [duration, setDuration] = useState(60);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a meeting title.");
      return;
    }
    if (!date || !time) {
      setError("Please choose a date and time.");
      return;
    }

    // No "Z" or offset in this string, so JavaScript reads it as the user's LOCAL time.
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) {
      setError("That date or time isn't valid.");
      return;
    }
    if (start.getTime() <= Date.now()) {
      setError("Please pick a time in the future.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const meeting = await scheduleMeeting({
        title: title.trim(),
        description: description.trim() || null,
        scheduled_at: start.toISOString(), // converted to UTC here
        duration_minutes: duration,
      });
      setCreated(meeting);
      onScheduled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't schedule the meeting.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyInviteLink() {
    if (!created?.invite_link) return;
    try {
      await navigator.clipboard.writeText(created.invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; ignore.
    }
  }

  // ---------- Success screen ----------
  if (created) {
    return (
      <Modal title="Meeting scheduled" onClose={onClose}>
        <div className="space-y-4">
          <div className="rounded-xl border border-zoom-border p-4 text-sm leading-6">
            <p className="text-base font-bold">{created.title}</p>
            {created.scheduled_start && (
              <>
                <p>{formatDate(created.scheduled_start)}</p>
                <p>{formatFullRange(created.scheduled_start, created.duration_minutes)}</p>
              </>
            )}
            <p className="text-zoom-muted">Meeting ID: {created.meeting_code}</p>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-zoom-bg p-2 pl-3">
            <span className="min-w-0 flex-1 truncate text-sm">{created.invite_link}</span>
            <button
              onClick={copyInviteLink}
              className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-zoom-blue hover:bg-zoom-blue-light"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-zoom-blue px-5 py-2 text-sm font-bold text-white hover:bg-zoom-blue-dark"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ---------- Form ----------
  const inputClass =
    "w-full rounded-lg border border-zoom-border px-3 py-2 outline-none focus:border-zoom-blue focus:ring-2 focus:ring-zoom-blue/30";

  return (
    <Modal title="Schedule meeting" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sched-title" className="mb-1 block text-sm font-bold">
            Title
          </label>
          <input
            id="sched-title"
            autoFocus
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Team sync"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="sched-desc" className="mb-1 block text-sm font-bold">
            Description <span className="font-normal text-zoom-muted">(optional)</span>
          </label>
          <textarea
            id="sched-desc"
            rows={2}
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sched-date" className="mb-1 block text-sm font-bold">
              Date
            </label>
            <input
              id="sched-date"
              type="date"
              min={toDateValue(new Date())}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sched-time" className="mb-1 block text-sm font-bold">
              Time
            </label>
            <input
              id="sched-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="sched-duration" className="mb-1 block text-sm font-bold">
            Duration
          </label>
          <select
            id="sched-duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className={inputClass}
          >
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                {m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-zoom-muted">
          Time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
        </p>

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
            disabled={submitting}
            className="rounded-lg bg-zoom-blue px-5 py-2 text-sm font-bold text-white hover:bg-zoom-blue-dark disabled:opacity-60"
          >
            {submitting ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </form>
    </Modal>
  );
}