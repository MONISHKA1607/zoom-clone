import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
} from "lucide-react";

// Layout only: none of these controls are part of the assignment's features.
export default function Navbar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zoom-border bg-white px-5">
      {/* Left: logo + product links */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-[28px] font-black lowercase leading-none tracking-tight text-zoom-blue">
            zoom
          </span>
          <span className="hidden h-6 w-px bg-zoom-border sm:block" />
          <span className="hidden text-xl font-bold sm:block">Workplace</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-zoom-muted xl:flex">
          <button className="flex items-center gap-1 hover:text-zoom-text">
            Discover Products <ChevronDown size={14} />
          </button>
          <button className="hover:text-zoom-text">Pricing</button>
        </nav>
      </div>

      {/* Middle: history arrows + search bar (hidden on small screens) */}
      <div className="hidden flex-1 items-center justify-center gap-3 text-zoom-muted lg:flex">
        <ChevronLeft size={18} />
        <ChevronRight size={18} />
        <Clock size={18} />
        <div className="flex h-10 w-full max-w-xl items-center rounded-lg bg-zoom-bg px-3">
          <Search size={18} />
          <span className="flex-1 text-center text-sm">Search Ctrl+K</span>
        </div>
      </div>

      {/* Right: admin, download, bell, avatar */}
      <div className="flex items-center gap-4">
        <button className="hidden text-sm text-zoom-muted hover:text-zoom-text md:block">
          Admin Center
        </button>
        <button className="hidden rounded-full bg-zoom-blue-light px-4 py-2 text-sm text-zoom-blue sm:block">
          Download
        </button>
        <button aria-label="Notifications" className="text-zoom-muted">
          <Bell size={20} />
        </button>
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-zoom-purple text-sm font-bold text-white">
          M
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
        </div>
      </div>
    </header>
  );
}