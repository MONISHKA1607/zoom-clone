"use client";

import { useCallback, useEffect, useState } from "react";

import ActionButtons from "@/components/ActionButtons";
import HeroClock from "@/components/HeroClock";
import MeetingSection from "@/components/MeetingSection";
import Navbar from "@/components/Navbar";
import { getRecentMeetings, getUpcomingMeetings } from "@/lib/api";
import type { Meeting } from "@/lib/types";

export default function Home() {
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wrapped in useCallback so we can reuse it later (e.g. refresh after scheduling).
  const loadMeetings = useCallback(async () => {
    try {
      // Run both requests in parallel instead of one after the other.
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
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <HeroClock />
            <ActionButtons
              // Wired up in the next steps (instant, join, schedule)
              onNewMeeting={() => {}}
              onJoin={() => {}}
              onSchedule={() => {}}
            />
          </div>

          <div className="space-y-8 lg:col-span-3">
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
      </main>
    </>
  );
}