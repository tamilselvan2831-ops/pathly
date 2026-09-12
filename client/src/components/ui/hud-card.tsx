import React from "react";

interface HudCardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: "cyan" | "purple" | "teal" | "amber";
  glow?: boolean;
  cornerBrackets?: boolean;
  eyebrow?: string;
  badge?: React.ReactNode;
}

export function HudCard({
  accent = "cyan",
  glow = true,
  cornerBrackets = false,
  eyebrow,
  badge,
  className = "",
  children,
  ...props
}: HudCardProps) {
  const accentStyles = {
    cyan: "border-cyan-500/20 hover:border-cyan-400/40 text-cyan-300",
    purple: "border-purple-500/20 hover:border-purple-400/40 text-purple-300",
    teal: "border-teal-500/20 hover:border-teal-400/40 text-teal-300",
    amber: "border-amber-500/20 hover:border-amber-400/40 text-amber-300",
  }[accent];

  const glowStyles = glow
    ? {
        cyan: "hover:shadow-[0_0_24px_rgba(0,242,254,0.14)]",
        purple: "hover:shadow-[0_0_24px_rgba(157,78,221,0.14)]",
        teal: "hover:shadow-[0_0_24px_rgba(5,213,179,0.14)]",
        amber: "hover:shadow-[0_0_24px_rgba(251,191,36,0.14)]",
      }[accent]
    : "";

  return (
    <div
      className={`relative rounded-2xl border bg-[#0b1222]/80 backdrop-blur-xl p-6 transition-all duration-300 ${accentStyles} ${glowStyles} ${
        cornerBrackets ? "hud-corner" : ""
      } ${className}`}
      {...props}
    >
      {(eyebrow || badge) && (
        <div className="flex items-center justify-between mb-4 gap-2">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          {badge && <div>{badge}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
