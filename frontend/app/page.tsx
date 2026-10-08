"use client";

import { useCallback, useEffect, useState } from "react";

import JoinModal from "@/components/JoinModal";
import { useRouter } from "next/navigation";
import { createInstantMeeting, getRecentMeetings, getUpcomingMeetings } from "@/lib/api";
import { saveParticipant } from "@/lib/session";

import ScheduleModal from "@/components/ScheduleModal";

import ActionButtons from "@/components/ActionButtons";
import AppShell from "@/components/AppShell";
import HeroClock from "@/components/HeroClock";
import MeetingSection from "@/components/MeetingSection";
import QuickLinks from "@/components/QuickLinks";
import type { Meeting } from "@/lib/types";

export default function Home() {
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showJoin, setShowJoin] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleNewMeeting() {
    if (creating) return; // ignore double clicks
    setCreating(true);
    setActionError(null);
    try {
      const { meeting, participant } = await createInstantMeeting();
      saveParticipant(meeting.meeting_code, participant);
      router.push(`/meeting/${meeting.meeting_code}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Couldn't start the meeting");
      setCreating(false);
    }
    // On success we deliberately leave `creating` true: the page is navigating away.
  }

  const loadMeetings = useCallback(async () => {
    try {
      const [upcomingData, recentData] = await Promise.all([
        getUpcomingMeetings(),
        getRecentMeetings(),
      ]);
      setUpcoming(upcomingData);
      setRecent(recentData);
      setError(null);
    } catch {
      setError("Couldn't load meetings. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <HeroClock />

        <ActionButtons
          creating={creating}
          onNewMeeting={handleNewMeeting}
          onJoin={() => setShowJoin(true)}
          onSchedule={() => setShowSchedule(true)}
        />

        {actionError && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
            {actionError}
          </p>
        )}

        <QuickLinks />

        <div className="space-y-8 rounded-2xl border border-zoom-border p-4">
          <MeetingSection
            title="Upcoming meetings"
            meetings={upcoming}
            loading={loading}
            error={error}
            emptyText="No upcoming meetings. Schedule one to get started."
            variant="upcoming"
          />
          <MeetingSection
            title="Recent meetings"
            meetings={recent}
            loading={loading}
            error={error}
            emptyText="No recent meetings yet."
            variant="recent"
          />
        </div>
      </div>
      {showJoin && <JoinModal onClose={() => setShowJoin(false)} />}
      {showSchedule && (
        <ScheduleModal
          onClose={() => setShowSchedule(false)}
          onScheduled={loadMeetings}
        />
      )}
    </AppShell>
  );
}