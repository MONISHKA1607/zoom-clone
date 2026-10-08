"use client";

import { useEffect, useState } from "react";

export default function HeroClock() {
  // Start as null: the server doesn't know the user's local time, so we only
  // fill it in after mounting in the browser (avoids a hydration mismatch).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id); // cleanup when the component unmounts
  }, []);

  return (
    <div className="rounded-2xl bg-zoom-blue p-6 text-white">
      <p className="text-5xl font-bold">
        {now
          ? now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
          : "--:--"}
      </p>
      <p className="mt-2 text-sm font-bold opacity-90">
        {now
          ? now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "\u00A0"}
      </p>
    </div>
  );
}