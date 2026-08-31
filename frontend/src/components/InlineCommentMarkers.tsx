import { useState } from "react";
import type { ReviewComment } from "../types";
import { fmtClock } from "./ReviewShared";

interface InlineCommentMarkersProps {
  comments: ReviewComment[];
  durationS: number;
  onSeek: (timeS: number) => void;
  onHighlight?: (commentId: number | null) => void;
  highlightedId?: number | null;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#f59e0b",
  open: "#3b82f6",
  resolved: "#22c55e",
  wont_fix: "#9ca3af",
};

/**
 * Renders clickable comment markers overlaid on the waveform.
 * Each marker is a vertical pin at the comment's timestamp.
 */
export default function InlineCommentMarkers({
  comments,
  durationS,
  onSeek,
  onHighlight,
  highlightedId,
}: InlineCommentMarkersProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  if (comments.length === 0 || durationS <= 0) return null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 24,
        pointerEvents: "none",
      }}
    >
      {comments.map((c) => {
        const pct = (c.time_s / durationS) * 100;
        const isHighlighted = highlightedId === c.id || hoveredId === c.id;
        const color = STATUS_COLORS[c.status] ?? "#888";

        return (
          <div
            key={c.id}
            style={{
              position: "absolute",
              left: `${pct}%`,
              top: 0,
              bottom: 0,
              width: 2,
              background: color,
              cursor: "pointer",
              pointerEvents: "auto",
              zIndex: isHighlighted ? 10 : 1,
              transition: "width 0.15s, background 0.15s",
              ...(isHighlighted ? { width: 3, background: "#fff" } : {}),
            }}
            onClick={() => {
              onSeek(c.time_s);
              onHighlight?.(c.id);
            }}
            onMouseEnter={() => {
              setHoveredId(c.id);
              onHighlight?.(c.id);
            }}
            onMouseLeave={() => {
              setHoveredId(null);
              onHighlight?.(null);
            }}
            title={`@${fmtClock(c.time_s)} — ${c.author_name ?? "anonymous"}: ${c.body.slice(0, 60)}`}
          >
            {/* Tooltip on hover */}
            {isHighlighted && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--bg-card)",
                  border: `1px solid ${color}`,
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 11,
                  whiteSpace: "nowrap",
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  pointerEvents: "none",
                  zIndex: 100,
                }}
              >
                <div style={{ fontWeight: 600, color, marginBottom: 2 }}>
                  @{fmtClock(c.time_s)}
                </div>
                <div style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.author_name ?? "anonymous"}: {c.body}
                </div>
              </div>
            )}

            {/* Pin marker dot */}
            <div
              style={{
                position: "absolute",
                top: -3,
                left: -3,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                border: isHighlighted ? "2px solid #fff" : "1px solid var(--bg-card)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
