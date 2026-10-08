"use client";

import { Check, Copy, Info, LayoutGrid, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";

import type { Meeting } from "@/lib/types";

export default function RoomHeader({ meeting }: { meeting: Meeting }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyInviteLink() {
    if (!meeting.invite_link) return;
    try {
      await navigator.clipboard.writeText(meeting.invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; ignore.
    }
  }

  return (
    <header className="relative flex h-11 shrink-0 items-center justify-between bg-black px-3 text-white">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Meeting information"
          aria-expanded={open}
          className="text-neutral-300 hover:text-white"
        >
          <Info size={16} />
        </button>
        <p className="truncate text-sm font-bold">{meeting.title}</p>
      </div>

      {/* Decorative, like Zoom's header icons */}
      <div className="flex items-center gap-3 text-neutral-300">
        <ShieldCheck size={18} className="text-green-500" />
        <Sparkles size={16} />
        <span className="hidden h-5 w-px bg-neutral-700 sm:block" />
        <LayoutGrid size={16} className="hidden sm:block" />
        <span className="hidden h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-black text-black sm:flex">
          zm
        </span>
      </div>

      {open && (
        <>
          {/* Invisible full-screen layer: clicking anywhere outside closes the popover. */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-2 top-full z-40 mt-1 w-80 max-w-[calc(100%-1rem)] space-y-3 rounded-lg bg-[#1f1f1f] p-4 text-sm shadow-xl">
            <p className="font-bold">{meeting.title}</p>
            <dl className="space-y-1 text-neutral-300">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-500">Meeting ID</dt>
                <dd>{meeting.meeting_code}</dd>
              </div>
              {meeting.host_name && (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Host</dt>
                  <dd className="truncate">{meeting.host_name}</dd>
                </div>
              )}
            </dl>
            <div className="flex items-center gap-2 rounded-md bg-black/40 p-2 pl-3">
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-300">
                {meeting.invite_link}
              </span>
              <button
                onClick={copyInviteLink}
                className="flex shrink-0 items-center gap-1 rounded-md bg-[#0e72ed] px-2.5 py-1 text-xs font-bold hover:bg-[#0b5cd5]"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}