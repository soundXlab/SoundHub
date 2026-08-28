import React, { useEffect, useState, useMemo } from 'react';
import { FullPageLayout } from '../components/FullPageLayout';
import { api } from '../api';
import type { Project, ReviewSession, ReviewVersion } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
} from '../components/ui';
import { Folder, Music, MessageSquare, Users, TrendingUp, TrendingDown, BarChart2, Clock, Activity, Waves, Volume2, Headphones, Database } from 'lucide-react';

// ─── Stat Card ───────────────────────────────────────────
const StatCard: React.FC<{
  label: string; value: string; change?: string; positive?: boolean;
  icon: React.ReactNode; color: string;
}> = ({ label, value, change, positive, icon, color }) => (
  <Card>
    <CardContent>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '15px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{value}</div>
        </div>
        <div style={{
          width: '32px', height: '38px', borderRadius: 'var(--radius-sm)',
          background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        }}>
          {icon}
        </div>
      </div>
      {change && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px',
          fontSize: '15px', color: positive ? 'var(--success)' : 'var(--error)',
        }}>
          {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>{change}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

// ─── Mini Bar Chart ──────────────────────────────────────
const MiniBar: React.FC<{ data: number[]; color: string; height?: number; labels?: string[] }> = ({
  data, color, height = 60, labels,
}) => {
  const max = Math.max(...data, 1);
  return (
    <Card>
      <CardContent>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height }}>
            {data.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{
                  width: '100%', height: `${(v / max) * 100}%`, minHeight: '2px',
                  background: color, borderRadius: '2px 2px 0 0', opacity: 0.8,
                }} />
                {labels && (
                  <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>{labels[i]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Waveform Visualization ──────────────────────────────
const WaveformDisplay: React.FC<{ data: number[]; height?: number; color?: string; label?: string }> = ({
  data, height = 48, color = 'var(--brand-primary)', label,
}) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '15px' }}>
            No waveform data
          </div>
        </CardContent>
      </Card>
    );
  }

  // Downsample to ~200 bars for display
  const bars = 200;
  const step = Math.max(1, Math.floor(data.length / bars));
  const sampled: number[] = [];
  for (let i = 0; i < data.length; i += step) {
    const chunk = data.slice(i, i + step);
    sampled.push(Math.max(...chunk));
  }

  const max = Math.max(...sampled, 0.01);

  return (
    <Card>
      <CardContent>
        {label && (
          <div style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        )}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1px', height,
          background: 'var(--bg-primary)', borderRadius: '3px', padding: '4px 6px',
        }}>
          {sampled.map((v, i) => (
            <div key={i} style={{
              flex: 1, height: `${(v / max) * 100}%`, minHeight: '1px',
              background: color, borderRadius: '1px', opacity: 0.85,
            }} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ─── LUFS Meter ──────────────────────────────────────────
const LufsMeter: React.FC<{ value: number | null; label: string; max?: number }> = ({
  value, label, max = 0,
}) => {
  const pct = value !== null ? Math.max(0, Math.min(100, ((value + 60) / 60) * 100)) : 0;
  const barColor = value !== null
    ? value > -14 ? 'var(--success)'
    : value > -24 ? 'var(--warning)'
    : 'var(--error)'
    : 'var(--text-muted)';

  return (
    <Card>
      <CardContent>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: value !== null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {value !== null ? `${value.toFixed(1)} LUFS` : '—'}
            </span>
          </div>
          <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%', background: barColor,
              borderRadius: '3px', transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Peak Meter ──────────────────────────────────────────
const PeakMeter: React.FC<{ value: number | null; label: string }> = ({ value, label }) => {
  const pct = value !== null ? Math.max(0, Math.min(100, ((value + 60) / 60) * 100)) : 0;
  const barColor = value !== null
    ? value > -1 ? 'var(--error)'
    : value > -6 ? 'var(--warning)'
    : 'var(--success)'
    : 'var(--text-muted)';

  return (
    <Card>
      <CardContent>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: value !== null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {value !== null ? `${value.toFixed(1)} dBTP` : '—'}
            </span>
          </div>
          <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%', background: barColor,
              borderRadius: '3px', transition: 'width 0.3s',
            }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Format Badge ────────────────────────────────────────
const FormatBadge: React.FC<{ format: string }> = ({ format }) => {
  const colorMap: Record<string, string> = {
    wav: '#4ade80', mp3: '#60a5fa', flac: '#c084fc', aiff: '#f472b6', alp: '#ff6b00', flp: '#39d98a', cpr: '#00b4ff', rpp: '#9b5de5',
  };
  return (
    <span style={{
      padding: '1px 5px', borderRadius: '2px', fontSize: '14px', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.3px',
      background: `${colorMap[format] || 'var(--text-muted)'}20`,
      color: colorMap[format] || 'var(--text-muted)',
    }}>
      {format}
    </span>
  );
};

// ─── Main Analytics Page ─────────────────────────────────
export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [allVersions, setAllVersions] = useState<(ReviewVersion & { sessionName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listProjects().catch(() => []),
      api.listSessions().catch(() => []),
    ]).then(async ([p, s]) => {
      setProjects(p);
      setSessions(s);

      // Fetch versions for each session
      const versions: (ReviewVersion & { sessionName?: string })[] = [];
      for (const sess of s) {
        try {
          const detail = await api.getSession(sess.id);
          if (detail.versions) {
            detail.versions.forEach(v => {
              versions.push({ ...v, sessionName: sess.name });
            });
          }
        } catch { /* skip */ }
      }
      setAllVersions(versions);
    }).finally(() => setLoading(false));
  }, []);

  // Compute stats
  const openSessions = sessions.filter(s => s.status === 'active' || s.rounds_open);
  const totalVersions = sessions.reduce((acc, s) => acc + (s.version_count || 0), 0);
  const avgVersions = sessions.length > 0 ? (totalVersions / sessions.length).toFixed(1) : '0';

  // Audio metrics
  const totalDuration = allVersions.reduce((acc, v) => acc + (v.duration_s || 0), 0);
  const totalSize = allVersions.reduce((acc, v) => acc + (v.size || 0), 0);
  const formatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allVersions.forEach(v => {
      const fmt = v.audio_format || 'unknown';
      counts[fmt] = (counts[fmt] || 0) + 1;
    });
    return counts;
  }, [allVersions]);

  // Month labels
  const now = new Date();
  const monthLabels: string[] = [];
  const projectByMonth = new Array(6).fill(0);
  const sessionByMonth = new Array(6).fill(0);

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthLabels.push(d.toLocaleString(undefined, { month: 'short' }));
    const monthStr = d.toISOString().slice(0, 7);
    projects.forEach(p => {
      if (p.created_at?.startsWith(monthStr)) projectByMonth[5 - i]++;
    });
    sessions.forEach(s => {
      if (s.created_at?.startsWith(monthStr)) sessionByMonth[5 - i]++;
    });
  }

  const formatDuration = (s: number) => {
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(0);
    return `${m}:${sec.padStart(2, '0')}`;
  };

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <FullPageLayout>
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                Last updated: {new Date().toLocaleTimeString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* ─── Stats Row ─── */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <StatCard
                  label="Projects" value={String(projects.length)}
                  change={`${projects.length} total`} positive
                  icon={<Folder size={16} />} color='var(--brand-primary)'
                />
                <StatCard
                  label="Reviews" value={String(sessions.length)}
                  change={`${openSessions.length} open`} positive={openSessions.length > 0}
                  icon={<MessageSquare size={16} />} color='var(--warning)'
                />
                <StatCard
                  label="Versions" value={String(totalVersions)}
                  change={`${avgVersions} avg/session`}
                  icon={<Music size={16} />} color='var(--success)'
                />
                <StatCard
                  label="Total Duration" value={formatDuration(totalDuration)}
                  change={`${allVersions.length} track(s)`}
                  icon={<Clock size={16} />} color='var(--info)'
                />
              </div>
            </CardContent>
          </Card>

          {/* ─── Audio Metrics Panel ─── */}
          {allVersions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Audio Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '10px', marginBottom: '16px' }}>
                  {/* Waveform gallery */}
                  <Card>
                    <CardHeader>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                        <Waves size={12} style={{ color: 'var(--brand-primary)' }} />
                        <CardTitle>Waveforms</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {allVersions.map(v => (
                          <div key={v.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                              <FormatBadge format={v.audio_format || 'wav'} />
                              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {v.sessionName} — v{v.number}
                              </span>
                              <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                                {formatDuration(v.duration_s)} · {formatBytes(v.size)}
                              </span>
                            </div>
                            <WaveformDisplay
                              data={v.waveform || []}
                              height={40}
                              color={v.waveform_synthetic ? 'var(--text-muted)' : 'var(--brand-primary)' }
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Audio stats sidebar */}
                  <Card>
                    <CardHeader>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <Volume2 size={12} style={{ color: 'var(--warning)' }} />
                        <CardTitle>Loudness</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <LufsMeter value={null} label="Integrated LUFS" />
                      <LufsMeter value={null} label="Short-term LUFS" />
                      <PeakMeter value={null} label="True Peak" />
                      <div style={{
                        marginTop: '8px', padding: '8px 12px', background: 'var(--warning-muted)',
                        borderRadius: '3px', fontSize: '15px', color: 'var(--warning)',
                      }}>
                        Analysis pending — upload a version to trigger audio analysis
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <Headphones size={12} style={{ color: 'var(--success)' }} />
                        <CardTitle>Formats</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {Object.entries(formatCounts).map(([fmt, count]) => (
                        <div key={fmt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FormatBadge format={fmt} />
                            <span style={{ fontSize: '16px', color: 'var(--text-primary)' }}>.{fmt}</span>
                          </div>
                          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{count}</span>
                        </div>
                      ))}
                      {Object.keys(formatCounts).length === 0 && (
                        <CardDescription>
                          No audio files yet
                        </CardDescription>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                        <Database size={12} style={{ color: 'var(--info)' }} />
                        <CardTitle>Storage</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Total size</span>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatBytes(totalSize)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Tracks</span>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{allVersions.length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>Avg duration</span>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {allVersions.length > 0 ? formatDuration(totalDuration / allVersions.length) : '—'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Charts ─── */}
          <Card>
            <CardHeader>
              <CardTitle>Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <Card>
                  <CardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <CardTitle>Projects Created</CardTitle>
                      <CardDescription>Last 6 months</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MiniBar data={projectByMonth} color='var(--brand-primary)' height={80} labels={monthLabels} />
                    <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>{projects.length}</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>total projects</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <CardTitle>Reviews Created</CardTitle>
                      <CardDescription>Last 6 months</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <MiniBar data={sessionByMonth} color='var(--warning)' height={80} labels={monthLabels} />
                    <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: 'var(--text-primary)' }}>{sessions.length}</div>
                    <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>total sessions</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* ─── Projects Table ─── */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>Projects</CardTitle>
                <CardDescription>{projects.length} total</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <CardDescription>
                  No projects yet
                </CardDescription>
              ) : (
                <div style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid var(--border-default)` }}>
                      {['Name', 'Owner', 'Branch', 'Updated'].map((h) => (
                        <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '15px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projects.slice(0, 10).map((p) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid var(--border-default)` }}>
                        <td style={{ padding: '10px 18px', fontSize: '14px' }}>
                          <a href={`/projects/${p.id}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>{p.name}</a>
                        </td>
                        <td style={{ padding: '10px 18px', fontSize: '16px', color: 'var(--text-muted)' }}>@{p.owner?.username}</td>
                        <td style={{ padding: '10px 18px', fontSize: '16px', color: 'var(--text-muted)' }}>{p.default_branch}</td>
                        <td style={{ padding: '10px 18px', fontSize: '16px', color: 'var(--text-muted)' }}>{new Date(p.updated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Sessions Table ─── */}
          <Card>
            <CardHeader>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <CardTitle>Review Sessions</CardTitle>
                <CardDescription>{sessions.length} total</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <CardDescription>
                  No sessions yet
                </CardDescription>
              ) : (
                <div style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid var(--border-default)` }}>
                      {['Name', 'Owner', 'Versions', 'Status', 'Updated'].map((h) => (
                        <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '15px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.slice(0, 10).map((s) => (
                      <tr key={s.id} style={{ borderBottom: `1px solid var(--border-default)` }}>
                        <td style={{ padding: '10px 18px', fontSize: '14px' }}>
                          <a href={`/session?token=${s.share_token}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none' }}>{s.name}</a>
                        </td>
                        <td style={{ padding: '10px 18px', fontSize: '16px', color: 'var(--text-muted)' }}>@{s.owner_username}</td>
                        <td style={{ padding: '10px 18px', fontSize: '16px', color: 'var(--text-muted)' }}>{s.version_count || 0}</td>
                        <td style={{ padding: '10px 18px', fontSize: '16px' }}>
                          <span style={{
                            padding: '1px 4px', borderRadius: '2px', fontSize: '15px', fontWeight: 600, textTransform: 'uppercase',
                            background: `${s.rounds_open ? 'var(--success)' : 'var(--text-muted)'}20`,
                            color: s.rounds_open ? 'var(--success)' : 'var(--text-muted)',
                          }}>
                            {s.rounds_open ? 'Open' : s.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 18px', fontSize: '16px', color: 'var(--text-muted)' }}>{new Date(s.updated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </FullPageLayout>
  );
}