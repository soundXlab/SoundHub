import React, { useEffect, useState, type FormEvent } from "react";
import { FullPageLayout } from "../components/FullPageLayout";
import { api } from "../api";
import type { ReviewSession } from "../types";
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
import { MessageSquare, Clock, Users, ExternalLink, Plus, Search, Music, ChevronRight, X, Loader } from "lucide-react";

const statusColor: Record<string, string> = {
  draft: "var(--text-muted)",
  active: "var(--success)",
  archived: "var(--warning)",
  closed: "var(--error)",
};

export default function ReviewsPage() {
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.listSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = sessions.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.owner_username?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const s = await api.createSession(newName.trim());
      setSessions(prev => [...prev, s]);
      setNewName('');
      setShowCreate(false);
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <FullPageLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '16px' }}>
        {/* Header */}
        <Card>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CardTitle>
                  <MessageSquare size={20} className="mr-2" />Reviews
                </CardTitle>
                <CardDescription>
                  {sessions.length} session(s)
                </CardDescription>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <Input
                    placeholder="Filter reviews..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ width: '200px' }}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
                  <Plus size={16} /> New Review
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Create dialog */}
        {showCreate && (
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <CardTitle>New Review Session</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                  <X size={14} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  placeholder="Session name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate(e)}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <Button variant="primary" size="sm" disabled={!newName.trim() || creating} onClick={handleCreate}>
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions list */}
        <Card>
          {loading ? (
            <CardContent>
              <p className="muted">Loading…</p>
            </CardContent>
          ) : filtered.length === 0 ? (
            <CardContent>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: '10px' }} />
                <p style={{ fontSize: '15px', marginBottom: '10px', color: 'var(--text-muted)' }}>
                  {filter ? 'No reviews match your filter.' : 'No review sessions yet.'}
                </p>
                {!filter && (
                  <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
                    Create your first review
                  </Button>
                )}
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filtered.map(s => (
                  <Card
                    key={s.id}
                    variant="interactive"
                    onClick={() => window.location.href = `/session?token=${s.share_token || s.id}`}
                    style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                  >
                    <CardContent>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Icon */}
                        <div style={{
                          width: '36px', height: '42px', borderRadius: 'var(--radius-sm)',
                          background: 'var(--brand-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--brand-primary)', flexShrink: 0,
                        }}>
                          <MessageSquare size={16} />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</span>
                            {s.status && (
                              <span style={{
                                fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px',
                                padding: '1px 4px', borderRadius: '2px',
                                background: `${statusColor[s.status] || 'var(--text-muted)'}20`,
                                color: statusColor[s.status] || 'var(--text-muted)',
                              }}>
                                {s.status}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '15px', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={8} />
                              {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : '—'}
                            </span>
                            {s.version_count > 0 && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Music size={8} />
                                {s.version_count} version(s)
                              </span>
                            )}
                            {s.round_number !== undefined && s.round_number > 0 && (
                              <span>Round {s.round_number}</span>
                            )}
                            {s.rounds_open && (
                              <span style={{ color: 'var(--success)' }}>● Open</span>
                            )}
                            {s.owner_username && (
                              <span>by @{s.owner_username}</span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </FullPageLayout>
  );
}