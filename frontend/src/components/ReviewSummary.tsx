import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { VersionSummary, VersionDiffField } from "../types";

interface ReviewSummaryProps {
  sessionId: number;
  versionId: number;
}

const FIELD_LABELS: Record<string, string> = {
  duration: "Duration",
  size: "File size",
  format: "Format",
  filename: "Filename",
  lufs: "LUFS",
  sample_rate: "Sample rate",
  bit_depth: "Bit depth",
};

const FIELD_ICONS: Record<string, string> = {
  duration: "⏱",
  size: "📦",
  format: "🎵",
  filename: "📄",
  lufs: "📊",
  sample_rate: "🎚",
  bit_depth: "🔢",
};

function formatValue(field: string, value: string | number | null, unit: string): string {
  if (value === null) return "—";
  if (field === "size" && typeof value === "number") {
    return `${(value / 1048576).toFixed(1)} MB`;
  }
  if (field === "duration" && typeof value === "number") {
    return `${value.toFixed(1)}s`;
  }
  if (field === "sample_rate" && typeof value === "number") {
    return `${(value / 1000).toFixed(1)} kHz`;
  }
  return `${value}${unit ? ` ${unit}` : ""}`;
}

export default function ReviewSummary({ sessionId, versionId }: ReviewSummaryProps) {
  const [summary, setSummary] = useState<VersionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const s = await api.getVersionSummary(sessionId, versionId);
      setSummary(s);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load summary");
    } finally {
      setLoading(false);
    }
  }, [sessionId, versionId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: 8 }}>
        Loading summary…
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ fontSize: 12, color: "var(--error)", padding: 8 }}>
        {err}
      </div>
    );
  }

  if (!summary || summary.changes.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: 8 }}>
        No changes detected vs previous version.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: 6,
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--text-secondary)",
          marginBottom: 8,
        }}
      >
        Changes vs previous version
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {summary.changes.map((c: VersionDiffField, i: number) => (
          <div
            key={`${c.field}-${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 8px",
              borderRadius: 4,
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>
              {FIELD_ICONS[c.field] ?? "•"}
            </span>
            <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>
              {FIELD_LABELS[c.field] ?? c.field}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", textDecoration: "line-through" }}>
              {formatValue(c.field, c.old, c.unit)}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--brand-primary)" }}>
              {formatValue(c.field, c.new, c.unit)}
            </span>
          </div>
        ))}
      </div>

      {summary.summary_text && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8 }}>
          {summary.summary_text}
        </div>
      )}
    </div>
  );
}
