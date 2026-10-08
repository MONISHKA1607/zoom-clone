"use client";

import { useCallback, useEffect, useState } from "react";

import ActionButtons from "@/components/ActionButtons";
import AppShell from "@/components/AppShell";
import HeroClock from "@/components/HeroClock";
import MeetingSection from "@/components/MeetingSection";
import QuickLinks from "@/components/QuickLinks";
import { getRecentMeetings, getUpcomingMeetings } from "@/lib/api";
import type { Meeting } from "@/lib/types";

export default function Home() {
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          // Wired up in the next steps (instant, join, schedule)
          onNewMeeting={() => {}}
          onJoin={() => {}}
          onSchedule={() => {}}
        />

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
    </AppShell>
  );
}