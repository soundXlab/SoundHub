import React, { useState, useEffect } from "react";
import { api } from "../api";
import type { MergeQueueEntry, ReviewVersion } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
  Switch,
} from "../components/ui";
import {
  GitBranch,
  Check,
  X,
  Clock,
  Zap,
  TrendingUp,
  List,
  Plus,
} from "lucide-react";
import { useTheme } from "../theme/themeContext";
import { colors, spacing, radii, typography } from "../design-tokens";

interface MergeQueuePanelProps {
  sessionId: number;
  versions: ReviewVersion[];
}

export default function MergeQueuePanel({ sessionId, versions }: MergeQueuePanelProps) {
  const { colors: themeColors } = useTheme();
  const [queue, setQueue] = useState<MergeQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadQueue();
  }, [sessionId]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await api.listMergeQueue(sessionId);
      setQueue(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load merge queue");
    } finally {
      setLoading(false);
    }
  };

  const handleEnqueue = async (versionId: number) => {
    try {
      await api.enqueueVersion(sessionId, versionId);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to merge queue");
    }
  };

  const handleMerge = async (queueId: number) => {
    setProcessing(true);
    try {
      await api.mergeVersion(sessionId, queueId);
      await loadQueue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to merge version");
    } finally {
      setProcessing(false);
    }
  };

  const handleRemove = async (queueId: number) => {
    // In a real implementation, there would be a delete endpoint
    // For now, we'll just remove from local state and show a message
    setError("Removal from queue not implemented in API");
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Merge Queue</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading queue...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get versions that are approved and not already in queue
  const approvedVersions = versions.filter(
    v => v.status === "approved" && !queue.some(q => q.version_id === v.id)
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <CardTitle className="text-lg font-semibold">Merge Queue</CardTitle>
        <div className="flex items-center gap-2 mt-3 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Refresh queue
              loadQueue();
            }}
          >
            <List size={16} /> Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Queue Section */}
        <div className="space-y-4">
          {queue.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Merge queue is empty</p>
              {approvedVersions.length > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // Auto-enqueue first approved version
                    if (approvedVersions[0]) {
                      handleEnqueue(approvedVersions[0].id);
                    }
                  }}
                >
                  Add First Approved Version
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((entry) => (
                <Card key={entry.id} className="border border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <GitBranch size={20} className="text-primary" />
                        <div>
                          <h3 className="font-medium">Position {queue.findIndex(e => e.id === entry.id) + 1}</h3>
                          <p className="text-sm text-muted-foreground">
                            Version {entry.version_id} • {new Date(entry.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={entry.status === "merged" ? "success" : entry.status === "processing" ? "warning" : "default"}
                        >
                          {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                        </Badge>
                        {entry.merged_at && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            Merged: {new Date(entry.merged_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {entry.status === "processing" && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-3 w-3 bg-primary rounded-full animate-pulse" />
                          <span className="text-sm text-muted-foreground">Processing merge...</span>
                        </div>
                        <div className="w-full bg-muted/50 h-2 rounded overflow-hidden">
                          <div className="bg-primary h-2 rounded" style={{ width: "60%" }} />
                        </div>
                      </div>
                    )}

                    {entry.status === "pending" && (
                      <div className="mt-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleMerge(entry.id)}
                          disabled={processing}
                        >
                          {processing ? "Merging..." : "Merge Now"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add to Queue Section */}
        {approvedVersions.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Ready to Queue</h3>
              <p className="text-xs text-muted-foreground">
                {approvedVersions.length} approved version{approvedVersions.length !== 1 ? 's' : ''} available
              </p>
            </div>

            <div className="space-y-3">
              {approvedVersions.map((version) => (
                <Card key={version.id} className="border hover:border-primary/20 transition-border cursor-pointer"
                  onClick={() => handleEnqueue(version.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{version.label || `Version ${version.number}`}</h3>
                        {version.message && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {version.message}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        <Plus size={16} /> Add to Queue
                      </Button>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground grid grid-cols-2 gap-4">
                      <div>Status: <span className="font-medium">{version.status}</span></div>
                      <div>Created: <span className="font-medium">{new Date(version.created_at).toLocaleDateString()}</span></div>
                      {version.duration_s && (
                        <div>Duration: <span className="font-medium">{Math.floor(version.duration_s / 60)}:{String(version.duration_s % 60).padStart(2, '0')}</span></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {error && (
        <CardFooter className="flex justify-start">
          <Badge variant="destructive">
            {error}
          </Badge>
        </CardFooter>
      )}
    </Card>
  );
}