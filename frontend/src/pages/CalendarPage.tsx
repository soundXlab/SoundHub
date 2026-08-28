import React, { useState, useEffect, useMemo } from 'react';
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
} from '../components/ui';
import { Calendar, ChevronLeft, ChevronRight, Clock, FileAudio, MessageSquare, Check, Folder, AlertCircle, RefreshCw } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type EventType = 'upload' | 'review' | 'approval' | 'deadline' | 'created' | 'updated';

interface CalendarEvent {
  date: string; // ISO date YYYY-MM-DD
  label: string;
  type: EventType;
  sessionId?: number;
  projectId?: number;
  link?: string;
}

const typeColors: Record<EventType, string> = {
  upload: 'var(--brand-primary)',
  review: 'var(--warning)',
  approval: 'var(--success)',
  deadline: 'var(--error)',
  created: 'var(--info)',
  updated: 'var(--text-muted)',
};

const typeIcons: Record<EventType, React.ReactNode> = {
  upload: <FileAudio size={8} />,
  review: <MessageSquare size={8} />,
  approval: <Check size={8} />,
  deadline: <AlertCircle size={8} />,
  created: <Folder size={8} />,
  updated: <Clock size={8} />,
};

function toISODate(dateStr: string): string {
  return dateStr.slice(0, 10); // YYYY-MM-DD
}

export default function CalendarPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [sessions, setSessions] = useState<ReviewSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.listSessions().catch(() => []),
      api.listProjects().catch(() => []),
    ]).then(([s, p]) => {
      setSessions(s);
      setProjects(p);
    }).finally(() => setLoading(false));
  }, []);

  // Generate calendar events from real data
  const events = useMemo<CalendarEvent[]>(() => {
    const evts: CalendarEvent[] = [];

    sessions.forEach(s => {
      // Session created
      if (s.created_at) {
        evts.push({
          date: toISODate(s.created_at),
          label: `${s.name} — created`,
          type: 'created',
          sessionId: s.id,
          link: `/session?token=${s.share_token}`,
        });
      }

      // Session updated (only if different from created)
      if (s.updated_at && s.updated_at !== s.created_at) {
        const updatedDate = toISODate(s.updated_at);
        const createdDate = toISODate(s.created_at);
        if (updatedDate !== createdDate) {
          evts.push({
            date: updatedDate,
            label: `${s.name} — updated`,
            type: 'updated',
            sessionId: s.id,
            link: `/session?token=${s.share_token}`,
          });
        }
      }

      // Feedback deadline
      if (s.feedback_due_at) {
        evts.push({
          date: toISODate(s.feedback_due_at),
          label: `${s.name} — feedback due`,
          type: 'deadline',
          sessionId: s.id,
          link: `/session?token=${s.share_token}`,
        });
      }

      // Session deadline
      if (s.deadline_at) {
        evts.push({
          date: toISODate(s.deadline_at),
          label: `${s.name} — deadline`,
          type: 'deadline',
          sessionId: s.id,
          link: `/session?token=${s.share_token}`,
        });
      }

      // Rounds open → review
      if (s.rounds_open && s.round_number) {
        evts.push({
          date: toISODate(s.updated_at || s.created_at),
          label: `${s.name} — round ${s.round_number} open`,
          type: 'review',
          sessionId: s.id,
          link: `/session?token=${s.share_token}`,
        });
      }
    });

    projects.forEach(p => {
      // Project created
      if (p.created_at) {
        evts.push({
          date: toISODate(p.created_at),
          label: `${p.name} — project created`,
          type: 'created',
          projectId: p.id,
          link: `/projects/${p.id}`,
        });
      }

      // Project updated (only if different from created)
      if (p.updated_at && p.updated_at !== p.created_at) {
        const updatedDate = toISODate(p.updated_at);
        const createdDate = toISODate(p.created_at);
        if (updatedDate !== createdDate) {
          evts.push({
            date: updatedDate,
            label: `${p.name} — project updated`,
            type: 'updated',
            projectId: p.id,
            link: `/projects/${p.id}`,
          });
        }
      }
    });

    return evts;
  }, [sessions, projects]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let startDay = firstDay.getDay() - 1; // Mon=0
  if (startDay < 0) startDay = 6;

  const today = now.getDate();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const prev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const next = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Upcoming events (from today onwards, next 7 days)
  const todayStr = toISODate(now.toISOString());
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  // Stats
  const monthEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <FullPageLayout>
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CardTitle>
                <Calendar size={20} className="mr-2" />Calendar
              </CardTitle>
              <CardDescription>
                {monthEvents.length} event(s) this month
              </CardDescription>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}>
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={prev}>
                <ChevronLeft size={14} />
              </Button>
              <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', minWidth: '180px', textAlign: 'center' }}>
                {MONTHS[month]} {year}
              </span>
              <Button variant="ghost" size="sm" onClick={next}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
            <div>
              {/* Calendar grid */}
              <Card>
                <CardHeader>
                  <CardTitle>Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Day headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid var(--border-default)` }}>
                    {DAYS.map(d => (
                      <div key={d} style={{
                        padding: '8px', textAlign: 'center', fontSize: '15px', fontWeight: 700,
                        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>{d}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                    {cells.map((day, i) => {
                      const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                      const dayEvents = dateStr ? (eventsByDate[dateStr] || []) : [];
                      const isToday = isCurrentMonth && day === today;

                      return (
                        <div key={i} style={{
                          minHeight: '96px', padding: '6px',
                          borderTop: i >= 7 ? `1px solid var(--border-default)` : 'none',
                          borderRight: (i + 1) % 7 !== 0 ? `1px solid var(--border-default)` : 'none',
                          background: isToday ? 'var(--brand-muted)' : 'transparent',
                        }}>
                          {day && (
                            <>
                              <div style={{
                                width: '22px', height: '34px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '16px', fontWeight: isToday ? 700 : 400,
                                color: isToday ? 'var(--brand-primary)' : 'var(--text-primary)',
                                background: isToday ? 'var(--brand-primary)20' : 'transparent',
                                marginBottom: '4px',
                              }}>
                                {day}
                              </div>
                              {dayEvents.slice(0, 3).map((ev, j) => (
                                <a key={j} href={ev.link || '#'} style={{
                                  display: 'flex', alignItems: 'center', gap: '3px',
                                  padding: '2px 4px', borderRadius: '2px', marginBottom: '2px',
                                  background: `${typeColors[ev.type]}15`, fontSize: '14px',
                                  color: typeColors[ev.type], overflow: 'hidden', textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap', textDecoration: 'none', cursor: 'pointer',
                                }}
                                title={ev.label}
                              >
                                {typeIcons[ev.type]}
                                {ev.label}
                              </a>
                              ))}
                              {dayEvents.length > 3 && (
                                <div style={{ fontSize: '16px', color: 'var(--text-muted)', paddingLeft: '4px' }}>
                                  +{dayEvents.length - 3} more
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Legend */}
              <Card>
                <CardHeader>
                  <CardTitle>Legend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {Object.entries(typeColors).map(([type, color]) => (
                      <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px', color: 'var(--text-muted)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right sidebar — upcoming events + stats */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming + Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>This Month</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{sessions.length}</div>
                          <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Sessions</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{projects.length}</div>
                          <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Projects</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--brand-primary)' }}>{monthEvents.length}</div>
                          <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Events</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--warning)' }}>
                            {events.filter(e => e.type === 'deadline').length}
                          </div>
                          <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Deadlines</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Upcoming events */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {upcomingEvents.length === 0 ? (
                        <CardDescription>
                          No upcoming events
                        </CardDescription>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {upcomingEvents.map((ev, i) => (
                            <a key={i} href={ev.link || '#'} style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '8px 12px', borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                              background: 'var(--bg-primary)', transition: 'background 0.15s',
                            }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
                            >
                              <div style={{
                                width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                                background: typeColors[ev.type],
                              }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '16px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ev.label}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                                  {new Date(ev.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick links */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <a href="/reviews" style={{ fontSize: '16px', color: 'var(--brand-primary)', textDecoration: 'none' }}>
                          → All Reviews ({sessions.length})
                        </a>
                        <a href="/projects" style={{ fontSize: '16px', color: 'var(--brand-primary)', textDecoration: 'none' }}>
                          → All Projects ({projects.length})
                        </a>
                        <a href="/upload" style={{ fontSize: '16px', color: 'var(--brand-primary)', textDecoration: 'none' }}>
                          → Upload Files
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </FullPageLayout>
  );
}