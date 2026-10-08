import type { ReactNode } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
  variant?: "home" | "room";
}

// "home": white scrolling panel. "room": black panel, nothing highlighted in the sidebar.
export default function AppShell({ children, variant = "home" }: AppShellProps) {
  const isRoom = variant === "room";
  return (
    <div className="flex h-dvh flex-col">
      <Navbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar activeItem={isRoom ? null : "Home"} />
        <main
          className={`mb-1 mr-1 min-w-0 flex-1 rounded-xl ${
            isRoom ? "flex flex-col overflow-hidden bg-black" : "overflow-y-auto bg-white"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}