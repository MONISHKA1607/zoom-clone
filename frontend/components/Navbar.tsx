import { Settings } from "lucide-react";

const NAV_ITEMS = ["Home", "Meetings", "Chat", "Calendar"];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-zoom-border bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <span className="text-2xl font-black lowercase tracking-tight text-zoom-blue">
            zoom
          </span>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <a
                key={item}
                href="#"
                className={`text-sm font-bold ${
                  item === "Home"
                    ? "border-b-2 border-zoom-blue py-4 text-zoom-blue"
                    : "text-zoom-muted hover:text-zoom-text"
                }`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>

        {/* Placeholders: no auth in this assignment */}
        <div className="flex items-center gap-3">
          <button
            aria-label="Settings"
            className="rounded-full p-2 text-zoom-muted hover:bg-zoom-bg"
          >
            <Settings size={20} />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zoom-blue text-sm font-bold text-white">
            MM
          </div>
        </div>
      </div>
    </header>
  );
}