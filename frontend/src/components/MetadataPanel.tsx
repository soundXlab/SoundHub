import { type DawInfo } from "../types";
import { BarChart2 } from "lucide-react";

interface MetadataPanelProps {
  info: DawInfo | null;
  compact?: boolean;
}

export default function MetadataPanel({ info, compact = false }: MetadataPanelProps) {
  if (!info) {
    return (
      <div className="metadata-panel metadata-panel-empty">
        <div className="metadata-panel-header">
          <BarChart2 className="metadata-panel-icon" size={16} />
          <span className="metadata-panel-title">Project Metadata</span>
        </div>
        <div className="metadata-panel-body">
          <span className="metadata-empty-text">No DAW metadata available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`metadata-panel ${compact ? "metadata-panel-compact" : ""}`}>
      <div className="metadata-panel-header">
        <BarChart2 className="metadata-panel-icon" size={16} />
        <span className="metadata-panel-title">Project Metadata</span>
        <span className="metadata-panel-badge">{info.format}</span>
      </div>

      <div className="metadata-panel-body">
        {/* Primary metrics row */}
        <div className="metadata-metrics-row">
          <div className="metadata-metric">
            <span className="metadata-metric-label">BPM</span>
            <span className="metadata-metric-value">{info.bpm ?? "—"}</span>
          </div>
          <div className="metadata-metric">
            <span className="metadata-metric-label">Signature</span>
            <span className="metadata-metric-value">{info.time_signature ?? "—"}</span>
          </div>
          <div className="metadata-metric">
            <span className="metadata-metric-label">Tracks</span>
            <span className="metadata-metric-value">{info.tracks.length}</span>
          </div>
          <div className="metadata-metric">
            <span className="metadata-metric-label">Plugins</span>
            <span className="metadata-metric-value">{info.plugins.length}</span>
          </div>
          <div className="metadata-metric">
            <span className="metadata-metric-label">Samples</span>
            <span className="metadata-metric-value">{info.samples.length}</span>
          </div>
        </div>

        {/* Version info */}
        <div className="metadata-info-row">
          <span className="metadata-info-label">Format</span>
          <span className="metadata-info-value">
            {info.format} <span className="metadata-info-muted">({info.version})</span>
          </span>
        </div>

        {/* Tracks list */}
        {info.tracks.length > 0 && (
          <div className="metadata-section">
            <div className="metadata-section-header">
              <span className="metadata-section-title">Tracks</span>
              <span className="metadata-section-count">{info.tracks.length}</span>
            </div>
            <div className="metadata-tracks-list">
              {info.tracks.slice(0, compact ? 5 : 10).map((track, idx) => (
                <div key={`${track.name}-${idx}`} className="metadata-track-row">
                  <span className="metadata-track-index">{idx + 1}</span>
                  <span className="metadata-track-name">{track.name}</span>
                  <span className="metadata-track-kind">{track.kind}</span>
                </div>
              ))}
              {!compact && info.tracks.length > 10 && (
                <div className="metadata-track-more">
                  +{info.tracks.length - 10} more tracks
                </div>
              )}
            </div>
          </div>
        )}

        {/* Plugins list */}
        {info.plugins.length > 0 && (
          <div className="metadata-section">
            <div className="metadata-section-header">
              <span className="metadata-section-title">Plugins</span>
              <span className="metadata-section-count">{info.plugins.length}</span>
            </div>
            <div className="metadata-tags">
              {info.plugins.slice(0, compact ? 4 : 8).map((plugin) => (
                <span key={plugin} className="metadata-tag">
                  {plugin}
                </span>
              ))}
              {!compact && info.plugins.length > 8 && (
                <span className="metadata-tag metadata-tag-more">
                  +{info.plugins.length - 8}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Samples list */}
        {info.samples.length > 0 && (
          <div className="metadata-section">
            <div className="metadata-section-header">
              <span className="metadata-section-title">Samples</span>
              <span className="metadata-section-count">{info.samples.length}</span>
            </div>
            <div className="metadata-tags">
              {info.samples.slice(0, compact ? 4 : 8).map((sample) => (
                <span key={sample} className="metadata-tag metadata-tag-sample">
                  {sample}
                </span>
              ))}
              {!compact && info.samples.length > 8 && (
                <span className="metadata-tag metadata-tag-more">
                  +{info.samples.length - 8}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
