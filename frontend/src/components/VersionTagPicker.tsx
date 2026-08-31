import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { VersionTag } from "../types";

const PRESET_TAGS = [
  { name: "release-candidate", color: "#f59e0b" },
  { name: "final", color: "#22c55e" },
  { name: "beta", color: "#3b82f6" },
  { name: "archived", color: "#9ca3af" },
  { name: "needs-work", color: "#ef4444" },
];

interface VersionTagPickerProps {
  sessionId: number;
  versionId: number;
  compact?: boolean;
}

export default function VersionTagPicker({ sessionId, versionId, compact }: VersionTagPickerProps) {
  const [tags, setTags] = useState<VersionTag[]>([]);
  const [adding, setAdding] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customColor, setCustomColor] = useState("#888888");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTags(await api.listVersionTags(sessionId, versionId));
    } catch {
      /* ignore */
    }
  }, [sessionId, versionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async (name: string, color: string) => {
    setErr(null);
    try {
      await api.addVersionTag(sessionId, versionId, name, color);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add tag");
    }
  };

  const remove = async (tagId: number) => {
    setErr(null);
    try {
      await api.removeVersionTag(sessionId, versionId, tagId);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to remove tag");
    }
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <span
          key={t.id}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            background: t.color + "22",
            color: t.color,
            border: `1px solid ${t.color}44`,
          }}
        >
          {t.name}
          <button
            type="button"
            onClick={() => void remove(t.id)}
            style={{
              background: "none",
              border: "none",
              color: t.color,
              cursor: "pointer",
              padding: 0,
              fontSize: 12,
              lineHeight: 1,
            }}
            title="Remove tag"
          >
            ×
          </button>
        </span>
      ))}

      {!adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{
            background: "none",
            border: "1px dashed var(--border-default)",
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 11,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          + tag
        </button>
      )}

      {adding && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {/* Preset tags */}
          {PRESET_TAGS.filter((p) => !tags.some((t) => t.name === p.name)).slice(0, 3).map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                void add(p.name, p.color);
                setAdding(false);
              }}
              style={{
                background: p.color + "22",
                color: p.color,
                border: `1px solid ${p.color}44`,
                borderRadius: 4,
                padding: "2px 6px",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {p.name}
            </button>
          ))}

          {/* Custom tag */}
          <input
            type="color"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            style={{ width: 20, height: 20, padding: 0, border: "none", cursor: "pointer" }}
          />
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="tag name"
            style={{
              width: 100,
              padding: "2px 6px",
              fontSize: 11,
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-default)",
              borderRadius: 3,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customName.trim()) {
                void add(customName.trim(), customColor);
                setCustomName("");
                setAdding(false);
              }
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (customName.trim()) {
                void add(customName.trim(), customColor);
                setCustomName("");
                setAdding(false);
              }
            }}
            disabled={!customName.trim()}
            style={{
              background: "var(--brand-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 3,
              padding: "2px 6px",
              fontSize: 11,
              cursor: customName.trim() ? "pointer" : "default",
            }}
          >
            ✓
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: 11,
            }}
          >
            ×
          </button>
        </div>
      )}

      {err && <span style={{ fontSize: 11, color: "var(--error)" }}>{err}</span>}
    </div>
  );
}
