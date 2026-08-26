import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import MetadataPanel from "../components/MetadataPanel";
import VersionHistory from "../components/VersionHistory";
import ActivityFeed from "../components/ActivityFeed";
import BatchALPImport from "../components/BatchALPImport";
import ALPBrowser from "../components/ALPBrowser";
import {
  BarChart2,
  FileText,
  List,
  Clock,
  GitBranch,
  Package,
  Settings2,
  File,
  Star,
  ArrowRightLeft,
  Download,
  Folder,
} from "lucide-react";
import {
  DAW_COLORS,
  humanSize,
  shortDate,
  type Branch,
  type Commit,
  type DawInfo,
  type Project,
  type ProjectFile,
  type Tree,
} from "../types";

type Tab = "overview" | "code" | "versions" | "activity";

export default function ProjectViewPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const pid = Number(id);
  const [project, setProject] = useState<Project | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState<string>(() => searchParams.get("branch") || "main");
  const [tree, setTree] = useState<Tree | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  // Initialize tab from searchParams, default to overview
  const [tab, setTab] = useState<Tab>(() => {
    const param = searchParams.get("tab");
    if (param === "overview" || param === "code" || param === "versions" || param === "activity") {
      return param as Tab;
    }
    return "overview";
  });
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asFolder, setAsFolder] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Keep searchParams in sync with tab state
  useEffect(() => {
    // Only update if the tab has changed and the searchParam is different
    const currentParam = searchParams.get("tab");
    if (currentParam !== tab) {
      searchParams.set("tab", tab);
      // Replace the current URL query string without pushing a new history entry
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${searchParams.toString()}`
      );
    }
  }, [tab, searchParams]);

  const load = useCallback(async () => {
    try {
      const [p, b] = await Promise.all([api.getProject(pid), api.listBranches(pid)]);
      setProject(p);
      setBranches(b);
      const current = b.some((x) => x.name === branch) ? branch : p.default_branch;
      setBranch(current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    }
  }, [pid, branch]);

  const loadBranch = useCallback(
    async (name: string) => {
      try {
        setError(null);
        const [t, c] = await Promise.all([api.getTree(pid, { branch: name }), api.listCommits(pid, name)]);
        setTree(t);
        setCommits(c);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load branch");
      }
    },
    [pid]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (project) loadBranch(branch);
  }, [branch, project?.id]);

  useEffect(() => {
    setReadme(null);
    if (!tree) return;
    const readmeFile = tree.files.find((f) => /^readme\.md$/i.test(f.path.split("/").pop() || ""));
    if (!readmeFile) return;
    fetch(api.fileUrl(pid, readmeFile.path, false, branch))
      .then((r) => r.text())
      .then((t) => setReadme(t))
      .catch(() => setReadme(null));
  }, [tree, pid, branch]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const files = fileInput.current?.files;
    if (!files || files.length === 0) {
      setNotice("Select at least one file to commit.");
      return;
    }
    setUploading(true);
    setNotice(null);
    try {
      await api.createCommit(pid, message.trim() || "Update project files", files, branch);
      setMessage("");
      if (fileInput.current) fileInput.current.value = "";
      await loadBranch(branch);
      await load();
      setNotice("Commit created ✓");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const dawBadge = (f: ProjectFile) =>
    f.daw_format && (
      <span className="badge badge-daw" style={{ background: DAW_COLORS[f.daw_format] ?? "#888" }}>
        {f.daw_format.toUpperCase()}
      </span>
    );

  const headCommit = tree ? tree.commit_id : commits[0]?.id;
  const prevCommit = commits.find((c) => c.id !== headCommit)?.id;
  const activeBranch = branches.find((b) => b.name === branch);

  // Get first DAW info from tree files
  const firstDawInfo: DawInfo | null = tree?.files.find((f) => f.daw_info)?.daw_info ?? null;

  return (
    <div className="project-view">
      {/* Header */}
      {project && (
        <div className="project-view-header">
          <div className="project-view-header-top">
            <div className="project-view-breadcrumb">
              <Link to="/projects" className="project-view-back">← Projects</Link>
              <span className="project-view-sep">/</span>
              <span className="project-view-owner">{project.owner.username}</span>
              <span className="project-view-sep">/</span>
              <span className="project-view-name">{project.name}</span>
              <span className="project-view-badge">Public</span>
            </div>
            <div className="project-view-actions">
              <button
                className="project-view-btn project-view-btn-danger"
                onClick={async () => {
                  if (confirm("Delete this project and all its commits?")) {
                    await api.deleteProject(pid);
                    window.location.href = "/projects";
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {project.description && (
            <p className="project-view-desc">{project.description}</p>
          )}

          {/* Tabs */}
          <div className="project-view-tabs">
            <button
              className={`project-view-tab ${tab === "overview" ? "active" : ""}`}
              onClick={() => setTab("overview")}
            >
              <BarChart2 className="project-view-tab-icon" size={16} />
              Overview
            </button>
            <button
              className={`project-view-tab ${tab === "code" ? "active" : ""}`}
              onClick={() => setTab("code")}
            >
              <FileText className="project-view-tab-icon" size={16} />
              Code
              {tree && <span className="project-view-tab-count">{tree.files.length}</span>}
            </button>
            <button
              className={`project-view-tab ${tab === "versions" ? "active" : ""}`}
              onClick={() => setTab("versions")}
            >
              <List className="project-view-tab-icon" size={16} />
              Versions
              {commits.length > 0 && <span className="project-view-tab-count">{commits.length}</span>}
            </button>
            <button
              className={`project-view-tab ${tab === "activity" ? "active" : ""}`}
              onClick={() => setTab("activity")}
            >
              <Clock className="project-view-tab-icon" size={16} />
              Activity
            </button>
            <Link to={`/projects/${pid}/branches`} className="project-view-tab">
              <GitBranch className="project-view-tab-icon" size={16} />
              Branches
              {branches.length > 0 && <span className="project-view-tab-count">{branches.length}</span>}
            </Link>
            <Link to={`/projects/${pid}/features`} className="project-view-tab">
              <Package className="project-view-tab-icon" size={16} />
              Features
            </Link>
          </div>
        </div>
      )}

      {error && <div className="project-view-error">{error}</div>}

      {/* Overview Tab */}
      {tab === "overview" && project && (
        <div className="project-view-grid">
          {/* Main content */}
          <div className="project-view-main">
            {/* Quick stats */}
            <div className="project-view-stats">
              <div className="project-view-stat">
                <span className="project-view-stat-label">Branch</span>
                <span className="project-view-stat-value">⎇ {branch}</span>
              </div>
              <div className="project-view-stat">
                <span className="project-view-stat-label">HEAD</span>
                <span className="project-view-stat-value">                    {commits.length > 0 ? `#${String(commits[0].id).slice(0, 7)}` : "—"}
                </span>
              </div>
              <div className="project-view-stat">
                <span className="project-view-stat-label">Files</span>
                <span className="project-view-stat-value">{tree?.files.length ?? 0}</span>
              </div>
              <div className="project-view-stat">
                <span className="project-view-stat-label">Commits</span>
                <span className="project-view-stat-value">{commits.length}</span>
              </div>
            </div>

            {/* Commit form */}
            <form className="project-view-commit-form" onSubmit={submit}>
              <div className="project-view-commit-header">
                <span className="project-view-commit-title">Push to {branch}</span>
              </div>
              <div className="project-view-commit-body">
                <input
                  type="text"
                  placeholder="Commit message, e.g. 'Add synth lead to arrangement'"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="project-view-commit-input"
                />
                <label className="project-view-upload-zone">
                  <input
                    ref={fileInput}
                    type="file"
                    multiple
                    hidden
                    {...(asFolder ? { webkitdirectory: "", directory: "" } : {})}
                  />
                  <Folder size={14} className="project-view-upload-icon" />
                  <span className="project-view-upload-text">
                    Click to select files{asFolder ? " (folder)" : ""} — .als, .alp, .cpr, .rpp, .flp
                  </span>
                </label>
                <div className="project-view-commit-footer">
                  <label className="project-view-checkbox">
                    <input
                      type="checkbox"
                      checked={asFolder}
                      onChange={(e) => setAsFolder(e.target.checked)}
                    />
                    Upload whole folder
                  </label>
                  <button className="project-view-btn project-view-btn-primary" disabled={uploading}>
                    {uploading ? "Committing…" : "Create commit"}
                  </button>
                </div>
                {notice && (
                  <div className={`project-view-notice ${notice.includes("✓") ? "success" : "error"}`}>
                    {notice}
                  </div>
                )}
              </div>
            </form>

            {/* Batch ALP Import */}
            <BatchALPImport
              projectId={pid}
              branch={branch}
              onImportComplete={() => {
                loadBranch(branch);
                load();
              }}
            />

            {/* File table */}
            <div className="project-view-file-table">
              <div className="project-view-file-table-header">
                <span className="project-view-file-table-title">Files on {branch}</span>
                <span className="project-view-file-table-count">
                  {tree ? `${tree.files.length} file(s)` : ""}
                </span>
              </div>
              {!tree ? (
                <div className="project-view-file-empty">No commits yet — upload your project files.</div>
              ) : (
                tree.files.map((f) => {
                  const isOpen = expanded === f.path;
                  return (
                    <div key={f.path} className="project-view-file-row-wrapper">
                      <div
                        className="project-view-file-row"
                        onClick={() => setExpanded(isOpen ? null : f.path)}
                      >
                        <span className="project-view-file-icon">
                          {f.daw_format ? <Settings2 size={14} /> : <File size={14} />}
                        </span>
                        <span className="project-view-file-name">{f.path}</span>
                        {dawBadge(f)}
                        <span className="project-view-file-size">{humanSize(f.size)}</span>
                        <span className="project-view-file-actions">
                          {headCommit && prevCommit && (
                            <Link
                              to={`/projects/${pid}/diff?path=${encodeURIComponent(f.path)}&from=${prevCommit}&to=${headCommit}`}
                              className="project-view-file-action"
                              onClick={(e) => e.stopPropagation()}
                            >
                              ⇄
                            </Link>
                          )}
                          <a
                            href={api.fileUrl(pid, f.path, true, branch)}
                            className="project-view-file-action"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ⬇
                          </a>
                        </span>
                      </div>
                      {isOpen && f.daw_format === "alp" ? (
                        <ALPBrowser
                          projectId={pid}
                          branch={branch}
                          filePath={f.path}
                          fileName={f.path.split("/").pop() || f.path}
                        />
                      ) : isOpen ? (
                        <DawInfoBox info={f.daw_info} />
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            {/* README */}
            {readme && (
              <div className="project-view-readme">
                <div className="project-view-readme-header">README.md</div>
                <div className="project-view-readme-body">
                  <pre style={{ fontFamily: "inherit", whiteSpace: "pre-wrap", background: "none", border: "none", padding: 0, margin: 0 }}>
                    {readme}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="project-view-sidebar">
            <MetadataPanel info={firstDawInfo} compact />
            <ActivityFeed commits={commits} projectId={pid} maxItems={8} />
          </div>
        </div>
      )}

      {/* Code Tab */}
      {tab === "code" && (
        <div className="project-view-code">
          {/* Branch selector */}
          <div className="project-view-branch-bar">
            <div className="branch-dropdown">
              <button className="branch-selector" onClick={() => setMenuOpen((o) => !o)}>
                <GitBranch size={14} />
                <span className="ml-2">{branch}</span>
                <span className="muted" style={{ fontSize: 11 }}>
                  {activeBranch ? `${activeBranch.commit_count} commit(s)` : ""}
                </span>
              </button>
              {menuOpen && (
                <div className="branch-menu">
                  {branches.map((b) => (
                    <div
                      key={b.name}
                      className={`branch-menu-item ${b.name === branch ? "active" : ""}`}
                      onClick={() => {
                        setBranch(b.name);
                        setMenuOpen(false);
                      }}
                    >
                      {b.is_default && <span className="default-star">★</span>}
                      <span>⎇</span> {b.name}
                      <span className="spacer" />
                      <span className="muted" style={{ fontSize: 11 }}>
                        {b.head_message.slice(0, 40)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="muted" style={{ fontSize: 12 }}>
              {tree ? `HEAD · ${tree.commit_message}` : "no commits yet"}
            </span>
          </div>

          {/* File table */}
          <div className="project-view-file-table">
            <div className="project-view-file-table-header">
              <span className="project-view-file-table-title">Files on {branch}</span>
              <span className="project-view-file-table-count">
                {tree ? `${tree.files.length} file(s)` : ""}
              </span>
            </div>
            {!tree ? (
              <div className="project-view-file-empty">No commits yet — upload your project files.</div>
            ) : (
              tree.files.map((f) => {
                const isOpen = expanded === f.path;
                return (
                  <div key={f.path} className="project-view-file-row-wrapper">
                    <div
                      className="project-view-file-row"
                      onClick={() => setExpanded(isOpen ? null : f.path)}
                    >
                      <span className="project-view-file-icon">
                        {f.daw_format ? <Settings2 size={14} /> : <File size={14} />}
                      </span>
                      <span className="project-view-file-name">{f.path}</span>
                      {dawBadge(f)}
                      <span className="project-view-file-size">{humanSize(f.size)}</span>
                      <span className="project-view-file-actions">
                        {headCommit && prevCommit && (
                          <Link
                            to={`/projects/${pid}/diff?path=${encodeURIComponent(f.path)}&from=${prevCommit}&to=${headCommit}`}
                            className="project-view-file-action"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ⇄
                          </Link>
                        )}
                        <a
                          href={api.fileUrl(pid, f.path, true, branch)}
                          className="project-view-file-action"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⬇
                        </a>
                      </span>
                    </div>
                    {isOpen && f.daw_format === "alp" ? (
                        <ALPBrowser
                          projectId={pid}
                          branch={branch}
                          filePath={f.path}
                          fileName={f.path.split("/").pop() || f.path}
                        />
                      ) : isOpen ? (
                        <DawInfoBox info={f.daw_info} />
                      ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Versions Tab */}
      {tab === "versions" && (
        <div className="project-view-versions">
          <VersionHistory
            commits={commits}
            projectId={pid}
            branch={branch}
            currentCommitId={headCommit != null ? Number(headCommit) : undefined}
          />
        </div>
      )}

      {/* Activity Tab */}
      {tab === "activity" && (
        <div className="project-view-activity">
          <ActivityFeed commits={commits} projectId={pid} maxItems={20} />
        </div>
      )}
    </div>
  );
}

function DawInfoBox({ info }: { info: DawInfo | null }) {
  if (!info) {
    return (
      <div className="project-view-daw-empty">
        Not a recognized DAW project file (or too large to analyze).
      </div>
    );
  }
  return (
    <div className="project-view-daw-box">
      <div className="project-view-daw-grid">
        <div>
          <dt>DAW</dt>
          <dd>
            {info.format} <span className="muted">({info.version})</span>
          </dd>
        </div>
        <div>
          <dt>BPM</dt>
          <dd>{info.bpm ?? "—"}</dd>
        </div>
        <div>
          <dt>Signature</dt>
          <dd>{info.time_signature ?? "—"}</dd>
        </div>
        <div>
          <dt>Tracks</dt>          <dd>{info.tracks?.length ?? "—"}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>" — "</dd>
        </div>
      </div>
      {info.tracks && info.tracks.length > 0 && (
        <div className="project-view-daw-tracks">
          {info.tracks.map((track, i) => (
            <div key={i} className="track-row">
              <span className="track-kind">{track.kind}</span>
              <span>{track.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
