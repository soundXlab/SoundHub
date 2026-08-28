import React, { useEffect, useState, type FormEvent } from "react";
import { FullPageLayout } from "../components/FullPageLayout";
import { api } from "../api";
import type { Project } from "../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
} from "../components/ui";
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
    <FullPageLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <CardDescription>{projects.length} repo(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : projects.length === 0 ? (
              <p className="muted">
                No projects yet. Create your first repo above — upload an Ableton,
                Cubase, REAPER or FL Studio project file.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {projects.map((p) => (
                  <Card
                    key={p.id}
                    variant="interactive"
                    onClick={() => window.location.href = `/projects/${p.id}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <CardHeader>
                      <CardTitle>
                        <Settings2 size={14} /> {p.name}
                      </CardTitle>
                    </CardHeader>
                    <CardDescription>{p.description || "No description"}</CardDescription>
                    <CardFooter>
                      <span className="muted">@{p.owner.username}</span>
                      <span className="muted">·</span>
                      <span className="muted">{new Date(p.updated_at).toLocaleDateString()}</span>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card style={{ marginTop: '20px' }}>
          <CardHeader>
            <CardTitle>New project</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={create}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Input
                    label="Project name"
                    placeholder="e.g. 'Neon Dreams EP'"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    label="Short description"
                    placeholder="Short description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Storage Policy</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Hot storage
                      <Input
                        type="number"
                        value={storagePolicy.hot_days}
                        onChange={(e) => setStoragePolicy(s => ({ ...s, hot_days: parseInt(e.target.value) || 30 }))}
                        min="1"
                        max="365"
                        style={{ width: 80 }}
                      />
                      <span>days</span>
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Warm storage
                      <Input
                        type="number"
                        value={storagePolicy.warm_days}
                        onChange={(e) => setStoragePolicy(s => ({ ...s, warm_days: parseInt(e.target.value) || 90 }))}
                        min="1"
                        max="365"
                        style={{ width: 80 }}
                      />
                      <span>days</span>
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Cold storage
                      <Input
                        type="number"
                        value={storagePolicy.cold_days}
                        onChange={(e) => setStoragePolicy(s => ({ ...s, cold_days: parseInt(e.target.value) || 365 }))}
                        min="1"
                        max="365"
                        style={{ width: 80 }}
                      />
                      <span>days</span>
                    </label>
                  </div>
                </div>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Input
                      type="checkbox"
                      checked={storagePolicy.enabled}
                      onChange={(e) => setStoragePolicy(s => ({ ...s, enabled: e.target.checked }))}
                    />
                    Enable storage lifecycle policy
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" type="submit">
                  Create repo
                </Button>
                {error && (
                  <div style={{ marginLeft: '12px', color: 'red', fontSize: '14px' }}>
                    {error}
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FullPageLayout>
  );
}