import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { BranchProtection } from "../types";
import { ShieldCheck, Lock, GitBranch, Users, Zap, X, Plus } from "lucide-react";

interface BranchProtectionPanelProps {
  projectId: number;
}

export default function BranchProtectionPanel({ projectId }: BranchProtectionPanelProps) {
  const [protections, setProtections] = useState<BranchProtection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [branchName, setBranchName] = useState("");
  const [requiredReviewers, setRequiredReviewers] = useState(0);
  const [requireStatusChecks, setRequireStatusChecks] = useState(false);
  const [restrictPushes, setRestrictPushes] = useState(false);
  const [requirePullRequest, setRequirePullRequest] = useState(true);

  useEffect(() => { loadProtections(); }, [projectId]);

  const loadProtections = async () => {
    setLoading(true);
    try {
      setProtections(await api.getBranchProtections(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createBranchProtection(projectId, {
        branch_name: branchName,
        required_reviewers: requiredReviewers,
        require_status_checks: requireStatusChecks,
        restrict_pushes: restrictPushes,
        allow_force_push: false,
        allow_deletions: false,
        require_pull_request: requirePullRequest,
      });
      setBranchName("");
      setRequiredReviewers(0);
      setRequireStatusChecks(false);
      setRestrictPushes(false);
      setRequirePullRequest(true);
      await loadProtections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this protection rule?")) return;
    try {
      await api.deleteBranchProtection(id);
      await loadProtections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 18 }}>
        <h3 style={{ margin: "0 0 12px" }}>Branch Protection</h3>
        <p className="muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Branch Protection</h3>
        <button className="btn ghost sm" onClick={loadProtections}>
          <Plus size={14} /> Refresh
        </button>
      </div>

      {/* Create form */}
      <form onSubmit={handleCreate} style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 4 }}>Branch name</label>
          <input
            type="text"
            placeholder="main, develop, release/*"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            disabled={creating}
            style={{ width: "100%", padding: "7px 12px", fontSize: 13 }}
          />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" min={0} max={10} value={requiredReviewers}
              onChange={(e) => setRequiredReviewers(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
              style={{ width: 60, padding: "4px 8px", fontSize: 13 }}
            /> reviewers
          </label>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={requirePullRequest}
              onChange={(e) => setRequirePullRequest(e.target.checked)}
            /> Require PR
          </label>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={requireStatusChecks}
              onChange={(e) => setRequireStatusChecks(e.target.checked)}
            /> Status checks
          </label>
          <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={restrictPushes}
              onChange={(e) => setRestrictPushes(e.target.checked)}
            /> Restrict pushes
          </label>
        </div>
        {error && <p className="error" style={{ margin: 0 }}>{error}</p>}
        <div>
          <button className="btn sm" type="submit" disabled={creating || !branchName.trim()}>
            {creating ? "Creating..." : "Add Rule"}
          </button>
        </div>
      </form>

      {/* Rules list */}
      {protections.length === 0 ? (
        <p className="muted" style={{ textAlign: "center", padding: 20 }}>No protection rules configured</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {protections.map((p) => (
            <div key={p.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.branch_name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <span>{p.require_pull_request ? "✓ PR required" : "— PR"}</span>
                  <span>{p.required_reviewers} reviewer{p.required_reviewers !== 1 ? "s" : ""}</span>
                  <span>{p.require_status_checks ? "✓ Checks" : "— Checks"}</span>
                  <span>{p.restrict_pushes ? "✓ Restricted" : "— Pushes"}</span>
                </div>
              </div>
              <button className="btn ghost sm" onClick={() => handleDelete(p.id)} style={{ color: "var(--red)" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
