import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { Project } from "../types";
import { Settings2 } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [storagePolicy, setStoragePolicy] = useState({
    hot_days: 30,
    warm_days: 90,
    cold_days: 365,
    enabled: true
  });

  const load = async () => {
    setLoading(true);
    try {
      setProjects(await api.listProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      const p = await api.createProject(name.trim(), desc.trim(), storagePolicy);
      setName("");
      setDesc("");
      setStoragePolicy({
        hot_days: 30,
        warm_days: 90,
        cold_days: 365,
        enabled: true
      });
      await load();
      window.location.href = `/projects/${p.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
  };

  return (
    <div>
      <div className="row" style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Projects</h1>
        <span className="muted">{projects.length} repo(s)</span>
      </div>

      <form className="card" onSubmit={create} style={{ marginBottom: 20 }}>
        <h2>New project</h2>
        <div className="row">
          <input
            type="text"
            placeholder="Project name, e.g. 'Neon Dreams EP'"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 2, minWidth: 260 }}
          />
          <input
            type="text"
            placeholder="Short description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ flex: 3, minWidth: 260 }}
          />
        </div>
        <div className="section" style={{ marginTop: 16 }}>
          <h3>Storage Policy</h3>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            <label>
              Hot storage
              <input
                type="number"
                value={storagePolicy.hot_days}
                onChange={(e) => setStoragePolicy(s => ({ ...s, hot_days: parseInt(e.target.value) || 30 }))}
                min="1"
                max="365"
                style={{ width: 60 }}
              />
              days
            </label>
            <label>
              Warm storage
              <input
                type="number"
                value={storagePolicy.warm_days}
                onChange={(e) => setStoragePolicy(s => ({ ...s, warm_days: parseInt(e.target.value) || 90 }))}
                min="1"
                max="365"
                style={{ width: 60 }}
              />
              days
            </label>
            <label>
              Cold storage
              <input
                type="number"
                value={storagePolicy.cold_days}
                onChange={(e) => setStoragePolicy(s => ({ ...s, cold_days: parseInt(e.target.value) || 365 }))}
                min="1"
                max="365"
                style={{ width: 60 }}
              />
              days
            </label>
          </div>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            <label className="muted" style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={storagePolicy.enabled}
                onChange={(e) => setStoragePolicy(s => ({ ...s, enabled: e.target.checked }))}
              />
              Enable storage lifecycle policy
            </label>
          </div>
        </div>
        <div className="row">
          <button className="btn" type="submit">
            Create repo
          </button>
        </div>
        {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}
      </form>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="muted">
          No projects yet. Create your first repo above — upload an Ableton,
          Cubase, REAPER or FL Studio project file.
        </p>
      ) : (
        <div className="grid">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="card project-card">
              <div className="name">
          <Settings2 size={14} className="mr-1" />
          {p.name}
        </div>
              <div className="desc">{p.description || "No description"}</div>
              <div className="row muted" style={{ fontSize: 12 }}>
                <span>@{p.owner.username}</span>
                <span>·</span>
                <span>updated {new Date(p.updated_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
