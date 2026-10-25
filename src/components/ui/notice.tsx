import type { ReactNode } from "react";
import { Icon } from "./icon";

export type Tone = "info" | "success" | "warning" | "error" | "unknown";
export function Notice({
  title,
  children,
  tone = "info",
  live = false,
}: {
  title: string;
  children?: ReactNode;
  tone?: Tone;
  live?: boolean;
}) {
  return (
    <div
      className={`notice notice-${tone}`}
      role={live ? (tone === "error" ? "alert" : "status") : undefined}
    >
      <Icon name={tone === "success" ? "check" : "info"} />
      <div>
        <strong>{title}</strong>
        {children && <div className="notice-body">{children}</div>}
      </div>
    </div>
  );
}
