import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type { SessionMember } from "../types";

interface ReviewerPanelProps {
  sessionId: number;
}

const ROLE_LABELS: Record<string, string> = {
  reviewer: "Reviewer",
  commenter: "Commenter",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  reviewer: "#3b82f6",
  commenter: "#a855f7",
  viewer: "#9ca3af",
};

export default function ReviewerPanel({ sessionId }: ReviewerPanelProps) {
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("reviewer");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMembers(await api.listMembers(sessionId));
    } catch {
      /* ignore */
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setErr(null);
    setNotice(null);
    try {
      await api.inviteMember(sessionId, email.trim(), role);
      setEmail("");
      setRole("reviewer");
      await load();
      setNotice(`Invited ${email.trim()} as ${ROLE_LABELS[role]}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (member: SessionMember) => {
    if (!window.confirm(`Remove ${member.email} from this review?`)) return;
    setErr(null);
    try {
      await api.removeMember(sessionId, member.id);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Remove failed");
    }
  };

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--text-secondary)",
          marginBottom: 8,
        }}
      >
        Reviewers · {members.length}
      </div>

      {/* Member list */}
      {members.length === 0 ? (
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
          No reviewers assigned yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 6,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: ROLE_COLORS[m.role] ?? "#888",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {m.email.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.email}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  invited by {m.invited_by} · {ROLE_LABELS[m.role] ?? m.role}
                </div>
              </div>

              {/* Status badge */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: "2px 6px",
                  borderRadius: 3,
                  background: m.status === "approved" ? "var(--success-muted)" : m.status === "reviewed" ? "#f59e0b22" : "var(--bg-secondary)",
                  color: m.status === "approved" ? "var(--success)" : m.status === "reviewed" ? "#f59e0b" : "var(--text-secondary)",
                }}
              >
                {m.status}
              </span>

              {/* Remove */}
              <button
                type="button"
                onClick={() => void remove(m)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: 14,
                  padding: 2,
                }}
                title="Remove reviewer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Invite form */}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          style={{
            flex: 1,
            padding: "6px 10px",
            fontSize: 13,
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void invite();
          }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{
            width: 110,
            padding: "6px 8px",
            fontSize: 12,
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
          }}
        >
          <option value="reviewer">Reviewer</option>
          <option value="commenter">Commenter</option>
          <option value="viewer">Viewer</option>
        </select>
        <button
          type="button"
          onClick={() => void invite()}
          disabled={busy || !email.trim()}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 600,
            background: "var(--brand-primary)",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: busy || !email.trim() ? "default" : "pointer",
            opacity: busy || !email.trim() ? 0.5 : 1,
          }}
        >
          {busy ? "…" : "Invite"}
        </button>
      </div>

      {notice && <div style={{ fontSize: 12, color: "var(--success)", marginTop: 6 }}>{notice}</div>}
      {err && <div style={{ fontSize: 12, color: "var(--error)", marginTop: 6 }}>{err}</div>}
    </div>
  );
}
