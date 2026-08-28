import React, { useState, useEffect } from 'react';
import { FullPageLayout } from '../components/FullPageLayout';
import { api } from '../api';
import type { Project, ReviewSession } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
} from '../components/ui';
import {
  Activity, Bell, BarChart2, Calendar, Clock, Download,
  ExternalLink, Folder, Home, Layout, Loader, MessageSquare,
  Music, Settings, TrendingUp, User, Users, Volume2, Waves, Zap,
} from 'lucide-react';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ projects: 0, sessions: 0, versions: 0 });

  useEffect(() => {
    Promise.all([
      api.listProjects().catch(() => [] as Project[]),
      api.listSessions().catch(() => [] as ReviewSession[]),
    ]).then(([p, s]) => {
      setProjects(p);
      setSessions(s);
      setStats({
        projects: p.length,
        sessions: s.length,
        versions: s.reduce((acc, sess) => acc + ((sess as any).versions?.length || 0), 0),
      });
    }).finally(() => setLoading(false));
  }, []);

  const recentSessions = sessions.slice(0, 6);
  const recentProjects = projects.slice(0, 4);
  const unreadCount = sessions.filter(s => s.status === 'active').length;

  return (
    <FullPageLayout activeSection="dashboard">
      <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layout size={22} /> Dashboard
            </h1>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Welcome back, Producer
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Bell size={20} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px',
                  background: 'var(--brand-primary)', color: '#fff',
                  fontSize: '10px', fontWeight: 700, borderRadius: '50%',
                  width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <a href="/settings" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              <Settings size={20} />
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[
            { label: 'Projects', value: stats.projects, icon: <Folder size={18} />, color: 'var(--brand-primary)' },
            { label: 'Reviews', value: stats.sessions, icon: <MessageSquare size={18} />, color: 'var(--warning)' },
            { label: 'Versions', value: stats.versions, icon: <Waves size={18} />, color: 'var(--success)' },
            { label: 'Activity', value: recentSessions.length, icon: <Activity size={18} />, color: 'var(--info)' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : s.value}
                    </div>
                  </div>
                  <div style={{ color: s.color, opacity: 0.6 }}>{s.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <CardTitle>Recent Projects</CardTitle>
                  <a href="/projects" style={{ fontSize: '14px', color: 'var(--brand-primary)', textDecoration: 'none' }}>View all →</a>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No projects yet. <a href="/projects" style={{ color: 'var(--brand-primary)' }}>Create one</a>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {recentProjects.map(p => (
                      <a key={p.id} href={`/projects/${p.id}`} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                        background: 'var(--bg-primary)', border: '1px solid var(--border-default)',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                            background: 'var(--brand-muted)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Folder size={16} style={{ color: 'var(--brand-primary)' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                              {p.created_at ? timeAgo(p.created_at) : '—'}
                            </div>
                          </div>
                        </div>
                        <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent activity
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {recentSessions.map(s => (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                        fontSize: '14px',
                      }}>
                        <MessageSquare size={12} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                            {s.status === 'active' ? 'review open' : s.status}
                          </span>
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {s.updated_at ? timeAgo(s.updated_at) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column — Quick Actions + Notifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { label: 'New Project', icon: <Folder size={14} />, href: '/projects', color: 'var(--brand-primary)' },
                    { label: 'Upload Files', icon: <Volume2 size={14} />, href: '/upload', color: 'var(--success)' },
                    { label: 'Review Session', icon: <MessageSquare size={14} />, href: '/reviews', color: 'var(--warning)' },
                    { label: 'View Analytics', icon: <BarChart2 size={14} />, href: '/analytics', color: 'var(--info)' },
                    { label: 'Calendar', icon: <Calendar size={14} />, href: '/calendar', color: 'var(--brand-primary)' },
                    { label: 'Settings', icon: <Settings size={14} />, href: '/settings', color: 'var(--text-muted)' },
                  ].map(action => (
                    <a key={action.label} href={action.href} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                      fontSize: '14px', color: 'var(--text-primary)',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ color: action.color }}>{action.icon}</span>
                      {action.label}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.filter(s => s.status === 'active').length === 0 ? (
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '10px 0' }}>
                    No unread notifications
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sessions.filter(s => s.status === 'active').slice(0, 5).map(s => (
                      <div key={s.id} style={{
                        padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                        background: 'var(--brand-muted)', border: '1px solid var(--brand-primary)30',
                        fontSize: '14px',
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '2px' }}>
                          Review Open
                        </div>
                        <div style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {s.created_at ? timeAgo(s.created_at) : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FullPageLayout>
  );
}
