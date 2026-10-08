import type { ReactNode } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="mb-1 mr-1 flex-1 overflow-y-auto rounded-xl bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}