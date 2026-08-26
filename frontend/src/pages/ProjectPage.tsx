import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";
import ReleaseSection from "../components/ReleaseSection";
import {
  FileText,
  History,
  GitBranch,
  Package,
  Settings2,
  File,
  Star,
  ArrowRightLeft,
  Download,
  Link as LinkLucide,
} from "lucide-react";
import {
  DAW_COLORS,
  humanSize,
  shortDate,
  type AudioAnalysis,
  type Branch,
  type Commit,
  type DawInfo,
  type Project,
  type ProjectFile,
  type Tree,
} from "../types";

type Tab = "code" | "commits";

export default function ProjectPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const pid = Number(id);
  const [project, setProject] = useState<Project | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branch, setBranch] = useState<string>(() => searchParams.get("branch") || "main");
  const [tree, setTree] = useState<Tree | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [tab, setTab] = useState<Tab>("code");
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asFolder, setAsFolder] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [showWebhookSetter, setShowWebhookSetter] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, project?.id]);

  // fetch README text when the tree changes
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

  // Fetch audio analysis for the current commit
  useEffect(() => {
    if (!tree) {
      setAudioAnalysis(null);
      return;
    }
    const fetchAnalysis = async () => {
      try {
        const analysis = await api.getAudioAnalysis(tree.commit_id);
        setAudioAnalysis(analysis);
      } catch (err) {
        console.warn('Failed to fetch audio analysis', err);
        setAudioAnalysis(null);
      }
    };
    fetchAnalysis();
  }, [tree]);

  // Load webhook URL from localStorage
  useEffect(() => {
    if (pid) {
      const saved = localStorage.getItem(`project_${pid}_webhook_url`);
      if (saved) {
        setWebhookUrl(saved);
      }
    }
  }, [pid]);

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
      const newCommit = await api.createCommit(pid, message.trim() || "Update project files", files, branch);
      setMessage("");
      if (fileInput.current) fileInput.current.value = "";
      await loadBranch(branch);
      await load();
      let notice = "Commit created ✓";
      // Trigger audio analysis if any audio-like files were uploaded
      const audioExtensions = /\.(wav|aiff|flac|mp3|als|alp|cpr|rpp|flp)$/i;
      const hasAudio = Array.from(files).some(f => audioExtensions.test(f.name));
      if (hasAudio) {
        try {
          const analysis = await api.processAudio(newCommit.id, {
            analyzeBpm: true,
            extractKey: true,
            separateStems: true,
            generateWaveform: true
          });
          const bpm = analysis.bpm ? `♪ ${Math.round(analysis.bpm)} BPM` : '';
          const key = analysis.key ? `• ${analysis.key}` : '';
          const stems = analysis.stems_generated && analysis.stem_names.length ? `• ${analysis.stem_names.length} stems` : '';
          const extra = [bpm, key, stems].filter(Boolean).join(' ');
          notice = `Commit created ✓ ${extra}`.trim();
        } catch (analysisErr) {
          console.warn('Audio analysis failed:', analysisErr);
          // Keep original notice
        }
      }
      setNotice(notice);
      // Fire webhook if URL is set
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              event: 'commit_created',
              projectId: pid,
              commitId: newCommit.id,
              branch: branch,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (webhookErr) {
          console.warn('Webhook call failed:', webhookErr);
          // Do not affect notice
        }
      }
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

  return (
    <div>
      {project && (
        <div className="repo-header">
          <div className="repo-breadcrumb">
            <span className="owner">{project.owner.username}</span>
            <span className="sep">/</span>
            <span className="name">{project.name}</span>
            <span className="visibility-chip">Public</span>
          </div>
          <p className="repo-desc">{project.description || "No description"}</p>
          <div className="row" style={{ marginTop: 6 }}>
            <Link to="/projects" className="btn ghost sm">
              ← projects
            </Link>
            <span className="spacer" />
            <button
              className="btn ghost sm"
              onClick={() => setShowWebhookSetter(true)}
              title="Webhook URL"
            >
              <LinkLucide size={16} className="mr-2" />
              Webhook
            </button>
            <span className="spacer" />
            <button
              className="btn danger sm"
              onClick={async () => {
                if (confirm("Delete this project and all its commits?")) {
                  await api.deleteProject(pid);
                  window.location.href = "/projects";
                }
              }}
            >
              Delete repo
            </button>
          </div>
          <div className="repo-tabs">
            <button className={`repo-tab ${tab === "code" ? "active" : ""}`} onClick={() => setTab("code")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <FileText size={16} className="mr-2" />
              Code
            </button>
            <button className={`repo-tab ${tab === "commits" ? "active" : ""}`} onClick={() => setTab("commits")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              <History size={16} className="mr-2" />
              Commits
              {commits.length > 0 && <span className="muted" style={{ fontSize: 11 }}>({commits.length})</span>}
            </button>
            <Link to={`/projects/${pid}/branches`} className="repo-tab">
              <GitBranch size={16} className="mr-2" />
              Branches
              {branches.length > 0 && <span className="muted" style={{ fontSize: 11 }}>({branches.length})</span>}
            </Link>
            <Link to={`/projects/${pid}/features`} className="repo-tab">
              <Package size={16} className="mr-2" />
              Features
            </Link>
            <span className="repo-tab" style={{ cursor: "default" }}>
              <Settings2 size={16} className="mr-2" />
              Release
            </span>
          </div>
        </div>
      )}

      {error && <div className="error" style={{ margin: "10px 0" }}>{error}</div>}

      {project && (
        <ReleaseSection
          projectId={pid}
          projectName={project.name}
          releaseTokenId={project.release_token_id}
          releaseContract={project.release_contract}
          releaseName={project.release_name}
          onBound={() => load()}
        />
      )}

      {tab === "code" && (
        <>
          {/* branch selector + commit form */}
          <div className="row" style={{ margin: "14px 0" }}>
            <div className="branch-dropdown">
              <button className="branch-selector" onClick={() => setMenuOpen((o) => !o)}>
                <GitBranch size={14} className="mr-2" />
                {branch}
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
                      {b.is_default && <span className="default-star"><Star size={14} /></span>}
                      <GitBranch size={14} /> {b.name}
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
            <span className="spacer" />
          </div>

          {/* commit form */}
          <form className="card" onSubmit={submit} style={{ marginBottom: 16 }}>
            <h2>Commit files to {branch}</h2>
            <input
              type="text"
              placeholder="Commit message, e.g. 'Add synth lead to arrangement'"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <label className="upload-zone" style={{ display: "block" }}>
              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                {...(asFolder ? { webkitdirectory: "", directory: "" } : {})}
              />
              Click to select files{asFolder ? " (folder)" : ""} — .als, .alp, .cpr, .rpp, .flp and samples all work.
            </label>
            <div className="row" style={{ marginTop: 10 }}>
              <label className="muted" style={{ fontSize: 13 }}>
                <input type="checkbox" checked={asFolder} onChange={(e) => setAsFolder(e.target.checked)} />
                {" "}upload whole folder (keeps paths)
              </label>
              <span className="spacer" />
              <button className="btn" disabled={uploading}>
                {uploading ? "Committing…" : "Create commit"}
              </button>
            </div>
            {notice && (
              <div className={notice.includes("✓") ? "success" : "error"} style={{ marginTop: 10 }}>
                {notice}
              </div>
            )}
          </form>

          {/* file table */}
          <div className="file-table">
            <div className="file-table-head">
              <span>Files on {branch}</span>
              <span>
                {tree ? `${tree.files.length} file(s)` : ""}
              </span>
              {audioAnalysis && (
                <span className="muted" style={{ marginLeft: 16 }}>
                  {audioAnalysis.bpm ? `♪ ${Math.round(audioAnalysis.bpm)} BPM` : ''}
                  {audioAnalysis.key ? ` • ${audioAnalysis.key}` : ''}
                  {audioAnalysis.stems_generated && audioAnalysis.stem_names.length ? ` • ${audioAnalysis.stem_names.length} stems` : ''}
                </span>
              )}
            </div>
            {!tree ? (
              <div className="file-row muted">No commits yet — upload your project files.</div>
            ) : (
              tree.files.map((f) => {
                const isOpen = expanded === f.path;
                return (
                  <div key={f.path}>
                    <div className="file-row" onClick={() => setExpanded(isOpen ? null : f.path)}>
                      <span className="file-icon">{f.daw_format ? <Settings2 size={14} /> : <File size={14} />}</span>
                      <span className="file-name">{f.path}</span>
                      {dawBadge(f)}
                      <span className="file-size">{humanSize(f.size)}</span>
                      <span className="file-actions">
                        {headCommit && prevCommit && (
                          <Link
                            to={`/projects/${pid}/diff?path=${encodeURIComponent(f.path)}&from=${prevCommit}&to=${headCommit}`}
                            title="Diff vs previous commit"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ArrowRightLeft size={14} />
                          </Link>
                        )}
                        <a
                          href={api.fileUrl(pid, f.path, true, branch)}
                          title="Download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download size={14} />
                        </a>
                      </span>
                    </div>
                    {isOpen && <DawInfoBox info={f.daw_info} />}
                  </div>
                );
              })
            )}
          </div>

          {/* README */}
          {readme && (
            <div className="readme-box">
              <div className="readme-head">README.md</div>
              <div className="readme-body">
                <pre style={{ fontFamily: "inherit", whiteSpace: "pre-wrap", background: "none", border: "none", padding: 0, margin: 0 }}>
                  {readme}
                </pre>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "commits" && (
        <div className="commit-list">
          <div className="commit-list-head">
            <span>Commits on {branch}</span>
            <span>
              {activeBranch ? `${activeBranch.commit_count} commit(s)` : ""}
            </span>
          </div>
          {commits.length === 0 && <div className="file-row muted">No commits.</div>}
          {commits.map((c) => (
            <div className="commit-list-row" key={c.id}>
              <span className="avatar">{c.author.username.slice(0, 1).toUpperCase()}</span>
              <Link className="commit-msg" to={`/projects/${pid}/commit/${c.id}`}>
                {c.message || "(no message)"}
              </Link>
              <span className="sha">#{c.id.toString().padStart(7, "0")}</span>
              <span className="commit-meta">
                {c.author.username} · {shortDate(c.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  {showWebhookSetter && (
    <div className="card" style={{ position: 'fixed', top: 20, left: 20, right: 20, maxWidth: 500, margin: 'auto', zIndex: 1000 }}>
      <h2>Webhook URL</h2>
      <div className="row" style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="https://your-domain.com/webhook"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <button className="btn" onClick={() => {
          // Save to localStorage
          localStorage.setItem(`project_${pid}_webhook_url`, webhookUrl);
          setShowWebhookSetter(false);
          setNotice('Webhook URL saved');
        }}>
          Save
        </button>
        <button className="btn ghost" onClick={() => setShowWebhookSetter(false)}>
          Cancel
        </button>
      </div>
    </div>
  )}
}

function DawInfoBox({ info }: { info: DawInfo | null }) {
  if (!info) {
    return (
      <div className="daw-box muted" style={{ fontSize: 12 }}>
        Not a recognized DAW project file (or too large to analyze).
      </div>
    );
  }
  return (
    <div className="daw-box">
      <div className="daw-grid">
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
          <dt>Tracks</dt>
          <dd>
            {info.tracks.map((t) => (
              <div className="track-row" key={t.name + t.kind}>
                <span>{t.name}</span>
                <span className="track-kind">{t.kind}</span>
              </div>
            ))}
          </dd>
        </div>
        <div>
          <dt>Plugins</dt>
          <dd>{info.plugins.length ? info.plugins.join(", ") : "—"}</dd>
        </div>
        <div>
          <dt>Samples</dt>
          <dd>{info.samples.length ? info.samples.join(", ") : "—"}</dd>
        </div>
      </div>
    </div>
  );
}
