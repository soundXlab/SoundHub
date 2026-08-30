import { Link } from "react-router-dom";
import { List, GitBranch } from "lucide-react";
import { type Commit } from "../types";

interface VersionHistoryProps {
  commits: Commit[];
  projectId: number;
  branch: string;
  currentCommitId?: number;
  onSelect?: (commitId: number) => void;
}

export default function VersionHistory({
  commits,
  projectId,
  branch,
  currentCommitId,
  onSelect,
}: VersionHistoryProps) {
  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const shortId = (id: string | number) => String(id).slice(0, 7);

  return (
    <div className="version-history">
      <div className="version-history-header">
        <h3 className="version-history-title">
          <List className="version-history-icon" size={16} />
          Version History
        </h3>
        <div className="version-history-meta">
          <GitBranch className="version-history-branch-icon" size={14} />
          <span className="version-history-branch">{branch}</span>
          <span className="version-history-count">{commits.length} versions</span>
        </div>
      </div>

      <div className="version-history-list">
        {commits.length === 0 ? (
          <div className="version-history-empty">
            No versions yet — push your first commit
          </div>
        ) : (
          commits.map((commit, idx) => {
            const isCurrent = commit.id === currentCommitId;
            const isHead = idx === 0;
            const isApproved = commit.message?.toLowerCase().includes("approved");

            return (
              <div
                key={commit.id}
                className={`version-history-row ${isCurrent ? "version-history-row-current" : ""} ${isHead ? "version-history-row-head" : ""}`}
                onClick={() => onSelect?.(commit.id)}
              >
                {/* Timeline connector */}
                <div className="version-history-timeline">
                  <div className={`version-history-dot ${isCurrent ? "version-history-dot-current" : ""} ${isApproved ? "version-history-dot-approved" : ""}`} />
                  {idx < commits.length - 1 && <div className="version-history-line" />}
                </div>

                {/* Version info */}
                <div className="version-history-content">
                  <div className="version-history-top">
                    <span className="version-history-id">
                      v{commits.length - idx}
                    </span>
                    <span className="version-history-sha">
                      #{shortId(commit.id)}
                    </span>
                    {isHead && <span className="version-history-badge version-history-badge-head">HEAD</span>}
                    {isApproved && <span className="version-history-badge version-history-badge-approved">✓ Approved</span>}
                  </div>

                  <div className="version-history-message">
                    {commit.message || "(no message)"}
                  </div>

                  <div className="version-history-footer">
                    <span className="version-history-author">
                      <span className="version-history-avatar">
                        {commit.author.username.slice(0, 1).toUpperCase()}
                      </span>
                      {commit.author.username}
                    </span>
                    <span className="version-history-time">
                      {formatTimeAgo(commit.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="version-history-actions">
                  <Link
                    to={`/projects/${projectId}/commit/${commit.id}`}
                    className="version-history-action"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </Link>
                  {idx > 0 && (
                    <Link
                      to={`/projects/${projectId}/diff?from=${commits[idx].id}&to=${commits[idx - 1].id}`}
                      className="version-history-action"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Diff
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
