import { TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";

interface ToastProps {
  children: ReactNode;
  onDismiss: () => void;
}

export default function Toast({ children, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      className="pointer-events-auto flex max-w-full items-center gap-3 rounded-lg bg-black px-4 py-2.5 text-sm text-white shadow-lg ring-1 ring-white/10"
    >
      <TriangleAlert size={16} className="shrink-0 text-yellow-400" />
      <span>{children}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-neutral-400 hover:text-white"
      >
        <X size={16} />
      </button>
    </div>
  );
}