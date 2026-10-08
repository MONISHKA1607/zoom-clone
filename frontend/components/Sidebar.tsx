import { Contact, Home, MessageSquare, Settings, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

const ITEMS: SidebarItem[] = [
  { label: "Home", icon: Home, active: true },
  { label: "Chat", icon: MessageSquare },
  { label: "Meetings", icon: Video },
  { label: "Contacts", icon: Contact },
];

function SidebarLink({ label, icon: Icon, active }: SidebarItem) {
  return (
    <a
      href="#"
      className={`flex flex-col items-center gap-1 rounded-xl py-3 text-xs ${
        active
          ? "bg-white text-zoom-text shadow-sm"
          : "text-zoom-muted hover:bg-white/60"
      }`}
    >
      <Icon size={22} />
      {label}
    </a>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden w-[84px] shrink-0 flex-col justify-between px-1 py-1 md:flex">
      <nav className="flex flex-col gap-1">
        {ITEMS.map((item) => (
          <SidebarLink key={item.label} {...item} />
        ))}
      </nav>
      <SidebarLink label="Settings" icon={Settings} />
    </aside>
  );
}