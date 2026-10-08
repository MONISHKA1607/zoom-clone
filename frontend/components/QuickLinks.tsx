import { CircleDot, FileText, PenLine } from "lucide-react";

const LINKS = [
  { label: "Recordings", icon: CircleDot, tint: "bg-red-50 text-red-500" },
  { label: "Summaries", icon: FileText, tint: "bg-indigo-50 text-indigo-500" },
  { label: "My Notes", icon: PenLine, tint: "bg-violet-50 text-violet-500" },
];

export default function QuickLinks() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {LINKS.map(({ label, icon: Icon, tint }) => (
        <button
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-zoom-border bg-white px-4 py-3 text-left font-bold hover:bg-zoom-bg"
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
            <Icon size={18} />
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}