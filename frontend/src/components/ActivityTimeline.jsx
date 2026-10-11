import React from "react";
import { eventPresentation, formatDate, utcDate } from "../utils/presentation";
export default function ActivityTimeline({ events = [] }) {
  const ordered = [...events].sort(
    (a, b) =>
      (utcDate(a.occurredAt || a.eventAt)?.getTime() || 0) -
      (utcDate(b.occurredAt || b.eventAt)?.getTime() || 0),
  );
  if (!ordered.length)
    return <p className="empty-state">No activity recorded.</p>;
  return (
    <ol className="activity-timeline">
      {ordered.map((event, index) => {
        const item = eventPresentation(event);
        return (
          <li
            key={`${event.auditId ? "audit" : "delivery"}-${event.auditId || event.eventId || index}`}
          >
            <span className="timeline-icon" aria-hidden="true">
              {/(Payment|Cash|Bank)/i.test(item.title)
                ? "$"
                : /Delivery|delivery/.test(item.title)
                  ? "\u2192"
                  : "\u2713"}
            </span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <p className="muted">
                <time>{formatDate(item.date)}</time>
                {item.actor !== "Not available" && ` · ${item.actor}`}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
