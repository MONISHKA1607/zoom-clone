import type { ReactNode } from "react";

interface StageProps {
  children: ReactNode;
  className?: string;
}

export default function Stage({ children, className = "" }: StageProps) {
  return (
    <div className="stage-container flex min-h-0 min-w-0 flex-1 items-center justify-center bg-black">
      <div className={`stage-box relative ${className}`}>{children}</div>
    </div>
  );
}