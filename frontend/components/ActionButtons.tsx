import { Calendar, Plus, Video } from "lucide-react";
import type { ReactNode } from "react";

interface ActionTileProps {
  label: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
}

function ActionTile({ label, icon, color, onClick }: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 focus:outline-none"
    >
      <span
        className={`flex h-20 w-20 items-center justify-center rounded-2xl text-white transition group-hover:brightness-90 group-focus-visible:ring-2 group-focus-visible:ring-zoom-blue group-focus-visible:ring-offset-2 ${color}`}
      >
        {icon}
      </span>
      <span className="text-sm font-bold text-zoom-text">{label}</span>
    </button>
  );
}

interface ActionButtonsProps {
  onNewMeeting: () => void;
  onJoin: () => void;
  onSchedule: () => void;
}

export default function ActionButtons({
  onNewMeeting,
  onJoin,
  onSchedule,
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 rounded-2xl border border-zoom-border bg-white p-6">
      <ActionTile
        label="New Meeting"
        icon={<Video size={32} />}
        color="bg-zoom-orange"
        onClick={onNewMeeting}
      />
      <ActionTile
        label="Join"
        icon={<Plus size={32} />}
        color="bg-zoom-blue"
        onClick={onJoin}
      />
      <ActionTile
        label="Schedule"
        icon={<Calendar size={32} />}
        color="bg-zoom-blue"
        onClick={onSchedule}
      />
    </div>
  );
}