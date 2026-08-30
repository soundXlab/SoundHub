import { type Commit } from "../types";
import { Clock, Upload, Check, Eye, Zap, Settings, Share2, ChevronDown } from "lucide-react";

interface ActivityItem {
  id: string | number;
  type: "push" | "comment" | "approval" | "review" | "system" | "merge";
  message: string;
  timestamp: string;
  user?: string;
  project?: string;
  commitId?: string | number;
}

interface ActivityFeedProps {
  commits?: Commit[];
  projectId?: number;
  maxItems?: number;
}

export default function ActivityFeed({
  commits = [],
  projectId: _projectId,
  maxItems = 10,
}: ActivityFeedProps) {
  // Convert commits to activity items
  const commitActivity: ActivityItem[] = commits.slice(0, maxItems).map((commit) => ({
    id: String(commit.id),
    type: "push" as const,
    message: commit.message || "Pushed a new version",
    timestamp: commit.created_at,
    user: commit.author.username,
    commitId: String(commit.id),
  }));

  // Add some mock activity items for demo
  const mockActivity: ActivityItem[] = [
    {
      id: "mock-1",
      type: "comment",
      message: 'Aisha commented @01:24 — "Kick and bass clash here"',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: "Aisha",
    },
    {
      id: "mock-2",
      type: "approval",
      message: "Marco approved this version",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: "Marco",
    },
    {
      id: "mock-3",
      type: "system",
      message: "Dedup saved 1.2 GB — 2 blobs reused",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-4",
      type: "review",
      message: "Review session opened",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Combine and sort by timestamp
  const allActivity = [...commitActivity, ...mockActivity]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, maxItems);

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case "push": return <Upload size={14} />;
      case "comment": return <Check size={14} />;
      case "approval": return <Eye size={14} />;
      case "review": return <Zap size={14} />;
      case "system": return <Settings size={14} />;
      case "merge": return <Share2 size={14} />;
      default: return <ChevronDown size={14} />;
    }
  };

  const activityColor = (type: string) => {
    switch (type) {
      case "push": return "#0068D6";
      case "comment": return "#f59e0b";
      case "approval": return "#10b981";
      case "review": return "#8b5cf6";
      case "system": return "#64748b";
      case "merge": return "#06b6d4";
      default: return "#64748b";
    }
  };

  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        <h3 className="activity-feed-title">
          <Clock size={14} className="activity-feed-icon" />
          Activity
        </h3>
        <span className="activity-feed-count">{allActivity.length} events</span>
      </div>

      <div className="activity-feed-list">
        {allActivity.map((item) => (
          <div key={item.id} className="activity-feed-row">
            <div
              className="activity-feed-icon-wrapper"
              style={{ backgroundColor: `${activityColor(item.type)}15` }}
            >
              {activityIcon(item.type)}
            </div>
            <div className="activity-feed-content">
              <div className="activity-feed-message">{item.message}</div>
              <div className="activity-feed-meta">
                {item.user && (
                  <span className="activity-feed-user">{item.user}</span>
                )}
                <span className="activity-feed-time">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
