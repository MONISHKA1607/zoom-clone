import type { CSSProperties, ReactNode } from "react";

// The outer box is a "size container", so its child can use cqw / cqh
// (1% of the container's width / height) to become the largest 16:9 box that
// fits, centered on black. That gives Zoom's side bars.
const outerStyle: CSSProperties = { containerType: "size" };
const innerStyle: CSSProperties = {
  width: "min(100cqw, calc(100cqh * 16 / 9))",
  height: "min(100cqh, calc(100cqw * 9 / 16))",
};

interface StageProps {
  children: ReactNode;
  className?: string;
}

export default function Stage({ children, className = "" }: StageProps) {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 items-center justify-center bg-black"
      style={outerStyle}
    >
      <div className={`relative ${className}`} style={innerStyle}>
        {children}
      </div>
    </div>
  );
}