"use client";

import { useEffect, useState } from "react";

export default function HeroClock() {
  // null on the server and first render; filled in after mounting in the browser.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <p className="text-6xl font-bold tracking-tight">
        {now
          ? now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
          : "--:--"}
      </p>
      <p className="mt-2 text-xl text-zoom-muted">
        {now
          ? now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })
          : "\u00A0"}
      </p>
    </div>
  );
}