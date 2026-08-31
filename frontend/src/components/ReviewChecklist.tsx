import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { PreflightCheck } from "../types";

interface ReviewChecklistProps {
  sessionId: number;
}

const STATUS_ICON: Record<string, string> = {
  pass: "✓",
  ok: "✓",
  fail: "✕",
  block: "✕",
  warn: "!",
  skip: "–",
};

const STATUS_COLOR: Record<string, string> = {
  pass: "var(--success)",
  ok: "var(--success)",
  fail: "var(--error)",
  block: "var(--error)",
  warn: "#f59e0b",
  skip: "var(--text-secondary)",
};

export default function ReviewChecklist({ sessionId }: ReviewChecklistProps) {
  const [checks, setChecks] = useState<PreflightCheck[]>([]);
  const [passed, setPassed] = useState(true);
  const [blocking, setBlocking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api.listChecks(sessionId);
      setChecks(result.checks);
      setPassed(result.passed);
      setBlocking(result.blocking);
    } catch {
      /* no checks yet */
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async () => {
    setLoading(true);
    setErr(null);
    try {
      const result = await api.runChecks(sessionId);
      setChecks(result.checks);
      setPassed(result.passed);
      setBlocking(result.blocking);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Checks failed");
    } finally {
      setLoading(false);
    }
  };

  const passedCount = checks.filter((c) => c.status === "pass" || c.status === "ok").length;
  const failedCount = checks.filter((c) => c.status === "fail" || c.status === "block").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "var(--text-secondary)",
          }}
        >
          QC Checks
          {checks.length > 0 && (
            <span style={{ fontWeight: 400, marginLeft: 6 }}>
              {passedCount}✓ {warnCount}! {failedCount}✕
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          style={{
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Running…" : checks.length > 0 ? "↻ Re-run" : "✓ Run checks"}
        </button>
      </div>

      {/* Blocking indicator */}
      {blocking && !passed && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            background: "#ef444411",
            border: "1px solid #ef444433",
            color: "var(--error)",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          ⚠ Blocking issues must be resolved before lock
        </div>
      )}

      {/* Passed indicator */}
      {passed && checks.length > 0 && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            background: "#22c55e11",
            border: "1px solid #22c55e33",
            color: "var(--success)",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          ✓ All checks passed
        </div>
      )}

      {/* Check list */}
      {checks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {checks.map((c, i) => (
            <div
              key={`${c.check_type}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 4,
                background: "var(--bg-elevated)",
                border: `1px solid ${STATUS_COLOR[c.status] ?? "var(--border-default)"}22`,
              }}
            >
              {/* Status icon */}
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  background: STATUS_COLOR[c.status] ?? "#888",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {STATUS_ICON[c.status] ?? "?"}
              </span>

              {/* Label */}
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{c.label}</span>

              {/* Detail */}
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.detail}</span>

              {/* Blocking badge */}
              {c.blocking && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "1px 4px",
                    borderRadius: 2,
                    background: "#ef444422",
                    color: "var(--error)",
                  }}
                >
                  blocking
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {checks.length === 0 && !loading && (
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          No checks run yet. Click "Run checks" to validate the latest version.
        </div>
      )}

      {err && <div style={{ fontSize: 12, color: "var(--error)", marginTop: 6 }}>{err}</div>}
    </div>
  );
}
