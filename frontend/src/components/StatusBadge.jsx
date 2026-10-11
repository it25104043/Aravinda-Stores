import React from "react";
import { humanize } from "../utils/presentation";
export default function StatusBadge({ value }) {
  return (
    <span
      className={`status-badge status-${String(value || "")
        .toLowerCase()
        .replace(/[^a-z_]/g, "")}`}
    >
      {humanize(value)}
    </span>
  );
}
