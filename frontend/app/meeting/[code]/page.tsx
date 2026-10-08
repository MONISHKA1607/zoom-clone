import { Suspense } from "react";

import MeetingRoom from "./MeetingRoom";

// Server component: it only provides the Suspense boundary.
// MeetingRoom is a client component that reads the URL via useParams().
export default function MeetingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-neutral-400">
          Loading meeting...
        </div>
      }
    >
      <MeetingRoom />
    </Suspense>
  );
}