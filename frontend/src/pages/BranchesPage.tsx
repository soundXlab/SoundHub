import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { shortDate, type Branch, type Project } from "../types";
import { FullPageLayout } from "../components/FullPageLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
} from "../components/ui";

export default function BranchesPage() {
  const { id } = useParams();
  const pid = Number(id);
  const [project, setProject] = useState<Project | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("main");

  const load = useCallback(async () => {
    try {
      const [p, b] = await Promise.all([api.getProject(pid), api.listBranches(pid)]);
      setProject(p);
      setBranches(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }, [pid]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    try {
      await api.createBranch(pid, name.trim(), from);
      setName("");
      await load();
      setNotice(`Branch "${name.trim()}" created ✓`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  };

  const remove = async (name_: string) => {
    if (!window.confirm(`Delete branch "${name_}? Its commits stay in history."`)) return;
    try {
      await api.deleteBranch(pid, name_);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <FullPageLayout>
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to={`/projects/${pid}`} variant="outline" size="sm">
                ← Project
              </Link>
              <CardTitle>Branches</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {project && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="owner">{project.owner.username}</span>
                  <span className="sep">/</span>
                  <span className="name">{project.name}</span>
                  <span className="sep">/</span>
                  <span className="name">Branches</span>
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          {error && (
            <CardDescription style={{ background: 'var(--error-muted)', color: 'var(--error)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </CardDescription>
          )}
          {notice && (
            <CardDescription style={{ background: 'var(--success-muted)', color: 'var(--success)', padding: '8px', borderRadius: 'var(--radius-sm)' }}>
              {notice}
            </CardDescription>
          )}

          <Card>
            <CardHeader>
              <CardTitle>New branch</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={create} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input
                    placeholder="Branch name, e.g. remix-vocals"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <Select
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    style={{ width: 180 }}
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        from {b.name}
                      </option>
                    ))}
                  </Select>
                  <Button variant="primary" size="sm" disabled={!name.trim()}>
                    Create branch
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>Branches</CardTitle>
                <CardDescription>{branches.length}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {branches.map((b) => (
                <Card
                  key={b.name}
                  variant="interactive"
                  onClick={() => window.location.href = `/projects/${pid}?branch=${encodeURIComponent(b.name)}`}
                  style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                >
                  <CardContent>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="file-icon">⎇</span>
                      <div style={{ flex: 1 }}>
                        <Link to={`/projects/${pid}?branch=${encodeURIComponent(b.name)}`} style={{ fontWeight: 700, textDecoration: 'none', color: 'inherit' }}>
                          {b.name}
                        </Link>
                        {b.is_default && <span style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px',
                          padding: '1px 4px',
                          borderRadius: '2px',
                          background: 'var(--success-muted)',
                          color: 'var(--success)'
                        }}>default</span>}
                        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                          {b.head_sha ? (
                            <>
                              <span className="sha">{b.head_sha}</span> · {b.head_message.slice(0, 60)}
                              {" · "}
                              {b.head_date ? shortDate(b.head_date) : ""}
                            </>
                          ) : (
                            "no commits"
                          )}
                        </div>
                      </div>
                      <span className="muted" style={{ fontSize: 12 }}>{b.commit_count} commit(s)</span>
                      {!b.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          color="var(--error)"
                          onClick={() => remove(b.name)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </FullPageLayout>
  );
}