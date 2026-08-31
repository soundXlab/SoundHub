import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { MergeQueueEntry, ReviewVersion } from "../types";
import { GitBranch, Check, X, Clock, List, Plus } from "lucide-react";

interface MergeQueuePanelProps {
  sessionId: number;
  versions: ReviewVersion[];
}

export default function MergeQueuePanel({ sessionId, versions }: MergeQueuePanelProps) {
  const [queue, setQueue] = useState<MergeQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadQueue(); }, [sessionId]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      setQueue(await api.listMergeQueue(sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  };

  const handleEnqueue = async (versionId: number) => {
    try {
      await api.enqueueVersion(sessionId, versionId);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enqueue");
    }
  };

  const handleMerge = async (queueId: number) => {
    setProcessing(true);
    try {
      await api.mergeVersion(sessionId, queueId);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to merge");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ margin: "0 0 12px" }}>Merge Queue</h3>
        <p className="muted">Loading...</p>
      </div>
    );
  }

  const approvedVersions = versions.filter(
    (v) => v.status === "approved" && !queue.some((q) => q.version_id === v.id)
  );

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Merge Queue</h3>
        <button className="btn ghost sm" onClick={loadQueue}>
          <List size={14} /> Refresh
        </button>
      </div>

      {/* Queue */}
      {queue.length === 0 ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <p className="muted">Queue is empty</p>
          {approvedVersions.length > 0 && (
            <button className="btn ghost sm" style={{ marginTop: 8 }}
              onClick={() => approvedVersions[0] && handleEnqueue(approvedVersions[0].id)}>
              Add First Approved
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {queue.map((entry) => (
            <div key={entry.id} className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <GitBranch size={16} style={{ color: "var(--accent)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    Position {queue.findIndex((e) => e.id === entry.id) + 1}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    Version {entry.version_id} · {new Date(entry.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="chip" style={{
                  background: entry.status === "merged" ? "var(--green-soft)" : entry.status === "merging" ? "var(--accent-soft)" : "var(--bg3)",
                  color: entry.status === "merged" ? "var(--green)" : entry.status === "merging" ? "var(--accent)" : "var(--muted)",
                }}>
                  {entry.status}
                </span>
                {entry.status === "queued" && (
                  <button className="btn sm" onClick={() => handleMerge(entry.id)} disabled={processing}>
                    {processing ? "..." : "Merge"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ready to queue */}
      {approvedVersions.length > 0 && (
        <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Ready to Queue ({approvedVersions.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {approvedVersions.map((v) => (
              <div key={v.id} className="card" style={{ padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => handleEnqueue(v.id)}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{v.label || `Version ${v.number}`}</div>
                  {v.message && <div style={{ fontSize: 12, color: "var(--muted)" }}>{v.message}</div>}
                </div>
                <button className="btn ghost sm"><Plus size={14} /> Queue</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--error-muted)", borderRadius: 6, fontSize: 13, color: "var(--red)" }}>
          {error}
        </div>
      )}
    </div>
  );
}
