import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Music,
  FileAudio,
  File,
  Settings2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  Play,
  Pause,
  Download,
  Info,

  Mic,
  Radio,
  Disc,
  Waves,
  Sliders,
} from "lucide-react";

interface ALPContents {
  als: string[];
  samples: string[];
  presets: string[];
  images: string[];
  other: string[];
  total: number;
}

interface ALPTrack {
  name: string;
  type: string;
  color: string;
  clips: { name: string; start: number; length: number }[];
}

interface ALPBrowserProps {
  projectId: number;
  branch: string;
  filePath: string;
  fileName: string;
}

type Category = "all" | "instruments" | "effects" | "samples" | "presets" | "other";

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; icon: React.ReactNode; color: string }
> = {
  all: { label: "All", icon: <Package size={14} />, color: "#888" },
  instruments: { label: "Instruments", icon: <Music size={14} />, color: "#FF6B6B" },
  effects: { label: "Audio Effects", icon: <Sliders size={14} />, color: "#4ECDC4" },
  samples: { label: "Samples", icon: <FileAudio size={14} />, color: "#45B7D1" },
  presets: { label: "Presets", icon: <Settings2 size={14} />, color: "#9C27B0" },
  other: { label: "Other", icon: <Folder size={14} />, color: "#607D8B" },
};

const SAMPLE_CATEGORIES = {
  "Loops": { icon: <Radio size={12} />, color: "#FF9800" },
  "One Shots": { icon: <Disc size={12} />, color: "#E91E63" },
  "Multisamples": { icon: <Mic size={12} />, color: "#9C27B0" },
  "FX": { icon: <Waves size={12} />, color: "#00BCD4" },
};

const TRACK_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
];

export default function ALPBrowser({
  projectId,
  branch,
  filePath,
  fileName,
}: ALPBrowserProps) {
  const [contents, setContents] = useState<ALPContents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [playingFile, setPlayingFile] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showArrangement, setShowArrangement] = useState(true);

  const tracks: ALPTrack[] = useMemo(() => {
    if (!contents) return [];
    const sampleNames = contents.samples.map((s) => s.split("/").pop() || s);
    return sampleNames.slice(0, 8).map((name, i) => ({
      name: name.replace(/\.[^.]+$/, ""),
      type: "audio",
      color: TRACK_COLORS[i % TRACK_COLORS.length],
      clips: [
        { name, start: 0, length: 4 + Math.random() * 4 },
        { name: name + " (2)", start: 8, length: 2 + Math.random() * 3 },
      ],
    }));
  }, [contents]);

  useEffect(() => {
    loadContents();
  }, [projectId, branch, filePath]);

  const loadContents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      const response = await fetch(
        `/api/projects/${projectId}/alp-contents?path=${encodeURIComponent(filePath)}&branch=${branch}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setContents(data);
      } else {
        // Fallback: parse from file list
        const treeResponse = await fetch(
          `/api/projects/${projectId}/tree?branch=${branch}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (treeResponse.ok) {
          const tree = await treeResponse.json();
          const prefix = filePath.replace(/[^/]+$/, "").replace(/^\//, "");
          const alpFiles = tree.files.filter((f: any) => f.path.startsWith(prefix));

          const parsed: ALPContents = {
            als: [],
            samples: [],
            presets: [],
            images: [],
            other: [],
            total: alpFiles.length,
          };

          for (const f of alpFiles) {
            const name = f.path.split("/").pop() || "";
            const ext = name.split(".").pop()?.toLowerCase() || "";
            if (ext === "als") parsed.als.push(name);
            else if (["wav", "aiff", "aif", "flac", "ogg", "mp3"].includes(ext))
              parsed.samples.push(name);
            else if (["adg", "adv", "alc", "xpl"].includes(ext))
              parsed.presets.push(name);
            else if (["png", "jpg", "jpeg", "gif", "bmp"].includes(ext))
              parsed.images.push(name);
            else parsed.other.push(name);
          }

          setContents(parsed);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ALP contents");
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = useMemo(() => {
    if (!contents) return [];
    let files: { name: string; category: Category; path: string; sampleCategory?: string }[] = [];

    const addFiles = (list: string[], cat: Category, sampleCat?: string) => {
      for (const f of list) {
        if (!searchQuery || f.toLowerCase().includes(searchQuery.toLowerCase())) {
          files.push({ name: f.split("/").pop() || f, category: cat, path: f, sampleCategory: sampleCat });
        }
      }
    };

    if (activeCategory === "all" || activeCategory === "instruments") addFiles(contents.als, "instruments");
    if (activeCategory === "all" || activeCategory === "effects") addFiles(contents.presets, "effects");
    if (activeCategory === "all" || activeCategory === "samples") addFiles(contents.samples, "samples");
    if (activeCategory === "all" || activeCategory === "presets") addFiles(contents.presets, "presets");
    if (activeCategory === "all" || activeCategory === "other") {
      addFiles(contents.images, "other");
      addFiles(contents.other, "other");
    }

    return files;
  }, [contents, activeCategory, searchQuery]);

  const folderTree = useMemo(() => {
    const tree: Record<string, string[]> = {};
    for (const f of filteredFiles) {
      const parts = f.path.split("/");
      if (parts.length > 1) {
        const folder = parts.slice(0, -1).join("/");
        if (!tree[folder]) tree[folder] = [];
        tree[folder].push(f.name);
      }
    }
    return tree;
  }, [filteredFiles]);

  const toggleFolder = (folder: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="alp-browser alp-browser-loading">
        <div className="alp-browser-spinner" />
        <span>Loading ALP contents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alp-browser alp-browser-error">
        <Package size={24} />
        <span>{error}</span>
      </div>
    );
  }

  if (!contents) {
    return (
      <div className="alp-browser alp-browser-empty">
        <Package size={24} />
        <span>No ALP data available</span>
      </div>
    );
  }

  return (
    <div className="alp-browser alp-browser-ableton">
      {/* Header - Ableton style */}
      <div className="alp-browser-header">
        <div className="alp-browser-title">
          <Package size={16} />
          <span>{fileName}</span>
          <button className="alp-browser-info-btn" onClick={() => setShowInfo(!showInfo)}>
            <Info size={14} />
          </button>
        </div>
        <div className="alp-browser-search">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="alp-browser-info">
          <div className="alp-browser-info-grid">
            <div className="alp-browser-info-item">
              <span className="alp-browser-info-label">Total</span>
              <span className="alp-browser-info-value">{contents.total}</span>
            </div>
            <div className="alp-browser-info-item">
              <span className="alp-browser-info-label">Samples</span>
              <span className="alp-browser-info-value">{contents.samples.length}</span>
            </div>
            <div className="alp-browser-info-item">
              <span className="alp-browser-info-label">Presets</span>
              <span className="alp-browser-info-value">{contents.presets.length}</span>
            </div>
            <div className="alp-browser-info-item">
              <span className="alp-browser-info-label">Projects</span>
              <span className="alp-browser-info-value">{contents.als.length}</span>
            </div>
          </div>
        </div>
      )}

      <div className="alp-browser-body">
        {/* Sidebar - Ableton-style categories */}
        <div className="alp-browser-sidebar">
          {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const count = cat === "all"
              ? contents.total
              : cat === "instruments"
              ? contents.als.length
              : cat === "effects"
              ? contents.presets.length
              : cat === "samples"
              ? contents.samples.length
              : cat === "presets"
              ? contents.presets.length
              : contents.images.length + contents.other.length;
            return (
              <button
                key={cat}
                className={`alp-browser-category ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                <span className="alp-browser-category-icon" style={{ color: config.color }}>
                  {config.icon}
                </span>
                <span className="alp-browser-category-label">{config.label}</span>
                <span className="alp-browser-category-count">{count}</span>
              </button>
            );
          })}

          {/* Sample sub-categories */}
          {activeCategory === "samples" && (
            <div className="alp-browser-subcategories">
              <div className="alp-browser-subcategory-header">Sample Types</div>
              {Object.entries(SAMPLE_CATEGORIES).map(([name, config]) => (
                <div key={name} className="alp-browser-subcategory">
                  <span style={{ color: config.color }}>{config.icon}</span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Track list */}
          {tracks.length > 0 && (
            <div className="alp-browser-tracks">
              <div className="alp-browser-tracks-header">Tracks</div>
              {tracks.map((track, i) => (
                <div key={i} className="alp-browser-track">
                  <div className="alp-browser-track-color" style={{ backgroundColor: track.color }} />
                  <span className="alp-browser-track-name">{track.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="alp-browser-files">
          {/* Arrangement view toggle */}
          <div className="alp-browser-view-toggle">
            <button
              className={`alp-browser-view-btn ${showArrangement ? "active" : ""}`}
              onClick={() => setShowArrangement(true)}
            >
              Arrangement
            </button>
            <button
              className={`alp-browser-view-btn ${!showArrangement ? "active" : ""}`}
              onClick={() => setShowArrangement(false)}
            >
              Browser
            </button>
          </div>

          {/* Arrangement view */}
          {showArrangement && tracks.length > 0 && (
            <div className="alp-browser-arrangement">
              <div className="alp-browser-timeline">
                <div className="alp-browser-timeline-ruler">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                    <div key={bar} className="alp-browser-timeline-bar">
                      <span>{bar + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="alp-browser-timeline-tracks">
                  {tracks.map((track, i) => (
                    <div key={i} className="alp-browser-timeline-track">
                      <div className="alp-browser-timeline-track-label">
                        <div className="alp-browser-timeline-track-color" style={{ backgroundColor: track.color }} />
                        <span>{track.name}</span>
                      </div>
                      <div className="alp-browser-timeline-clips">
                        {track.clips.map((clip, j) => (
                          <div
                            key={j}
                            className="alp-browser-timeline-clip"
                            style={{
                              left: `${(clip.start / 16) * 100}%`,
                              width: `${(clip.length / 16) * 100}%`,
                              backgroundColor: track.color,
                            }}
                            title={clip.name}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* File browser */}
          <div className="alp-browser-file-list">
            {/* Root files */}
            {filteredFiles
              .filter((f) => !f.path.includes("/"))
              .map((file, i) => (
                <div
                  key={i}
                  className={`alp-browser-file ${selectedFile === file.path ? "selected" : ""}`}
                  onClick={() => setSelectedFile(file.path)}
                >
                  <span className="alp-browser-file-icon" style={{ color: CATEGORY_CONFIG[file.category].color }}>
                    {CATEGORY_CONFIG[file.category].icon}
                  </span>
                  <span className="alp-browser-file-name">{file.name}</span>
                  {file.category === "samples" && (
                    <button
                      className="alp-browser-play-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingFile(playingFile === file.path ? null : file.path);
                      }}
                    >
                      {playingFile === file.path ? <Pause size={12} /> : <Play size={12} />}
                    </button>
                  )}
                </div>
              ))}

            {/* Folder files */}
            {Object.entries(folderTree).map(([folder, files]) => (
              <div key={folder} className="alp-browser-folder">
                <div className="alp-browser-folder-header" onClick={() => toggleFolder(folder)}>
                  {expandedFolders.has(folder) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  {expandedFolders.has(folder) ? <FolderOpen size={14} /> : <Folder size={14} />}
                  <span>{folder}</span>
                  <span className="alp-browser-folder-count">{files.length}</span>
                </div>
                {expandedFolders.has(folder) && (
                  <div className="alp-browser-folder-files">
                    {files.map((name, i) => {
                      const fullPath = `${folder}/${name}`;
                      const file = filteredFiles.find((f) => f.path === fullPath);
                      return (
                        <div
                          key={i}
                          className={`alp-browser-file alp-browser-file-nested ${selectedFile === fullPath ? "selected" : ""}`}
                          onClick={() => setSelectedFile(fullPath)}
                        >
                          <span className="alp-browser-file-icon" style={{ color: file ? CATEGORY_CONFIG[file.category].color : "#888" }}>
                            {file ? CATEGORY_CONFIG[file.category].icon : <File size={14} />}
                          </span>
                          <span className="alp-browser-file-name">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {filteredFiles.length === 0 && (
              <div className="alp-browser-empty-files">No files found</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="alp-browser-footer">
        <span>{filteredFiles.length} files</span>
        <button className="alp-browser-download-btn">
          <Download size={14} />
          Download All
        </button>
      </div>
    </div>
  );
}
