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
  Badge,
} from "../components/ui";
import { Settings2, TrendingUp, Users, Clock, Loader } from "lucide-react";
import { useTheme } from "../theme/themeContext";
import { colors, spacing, radii, typography } from "../design-tokens";

export default function ProjectsPage() {
  const { colors: themeColors } = useTheme();
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
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: `${spacing.xl} ${spacing['2xl']}`
      }}>
        <Card style={{ backgroundColor: themeColors.bg.elevated, border: `1px solid ${themeColors.border.default}` }}>
          <CardHeader style={{
            padding: `${spacing.md} ${spacing.lg}`,
            borderBottom: `1px solid ${themeColors.border.subtle}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: spacing.md
          }}>
            <div>
              <CardTitle style={{
                fontSize: typography.fontSize.h2,
                fontWeight: typography.fontWeight.semiBold,
                color: themeColors.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}>
                <Settings2 size={20} /> Projects
              </CardTitle>
              <CardDescription style={{
                fontSize: typography.fontSize.body,
                color: themeColors.text.muted
              }}>
                {projects.length} {projects.length === 1 ? 'repo' : 'repos'}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/projects/new'}>
              <Settings2 size={16} /> New Project
            </Button>
          </CardHeader>
          <CardContent style={{ padding: spacing.lg }}>
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: `${spacing.lg} 0`,
                color: themeColors.text.muted
              }}>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
              </div>
            ) : projects.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: `${spacing.lg} 0`,
                color: themeColors.text.muted
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing.lg
                }}>
                  <Folder size={48} style={{ color: themeColors.text.muted, opacity: 0.5 }} />
                  <h3 style={{
                    margin: 0,
                    fontSize: typography.fontSize.h3,
                    fontWeight: typography.fontWeight.medium,
                    color: themeColors.text.primary
                  }}>
                    No projects yet
                  </h3>
                  <p style={{
                    marginTop: spacing.xs,
                    fontSize: typography.fontSize.body,
                    color: themeColors.text.muted,
                    maxWidth: '400px',
                    textAlign: 'center'
                  }}>
                    Create your first repo above — upload an Ableton, Cubase, REAPER or FL Studio project file.
                  </p>
                  <Button variant="secondary" size="sm" onClick={() => window.location.href = '/projects/new'}>
                    Create First Project
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: spacing.lg }}>
                {projects.map((p) => (
                  <Card
                    key={p.id}
                    variant="interactive"
                    onClick={() => window.location.href = `/projects/${p.id}`}
                    style={{
                      cursor: 'pointer',
                      border: `1px solid transparent`,
                      borderRadius: radii.md,
                      transition: 'all 0.15s ease',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = themeColors.bg.hover;
                      e.currentTarget.style.borderColor = `1px solid ${themeColors.border.hover}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = '1px solid transparent';
                    }}
                  >
                    <CardContent style={{ padding: spacing.lg }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <CardTitle style={{
                            fontSize: typography.fontSize.h3,
                            fontWeight: typography.fontWeight.medium,
                            color: themeColors.text.primary,
                            marginBottom: spacing.xs
                          }}>{p.name}</CardTitle>
                          {p.description && (
                            <CardDescription style={{
                              fontSize: typography.fontSize.body,
                              color: themeColors.text.muted,
                              display: '-webkit-box',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 2,
                              overflow: 'hidden'
                            }}>
                              {p.description}
                            </CardDescription>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: spacing.xs }}>
                          <Badge variant="secondary" style={{
                            fontSize: typography.fontSize.caption,
                            padding: `${spacing.xs} ${spacing.sm}`
                          }}>
                            @{p.owner.username}
                          </Badge>
                          <Badge variant="secondary" style={{
                            fontSize: typography.fontSize.caption,
                            padding: `${spacing.xs} ${spacing.sm}`
                          }}>
                            {new Date(p.updated_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card style={{ marginTop: spacing.lg, backgroundColor: themeColors.bg.elevated, border: `1px solid ${themeColors.border.default}` }}>
          <CardHeader style={{
            padding: `${spacing.md} ${spacing.lg}`,
            borderBottom: `1px solid ${themeColors.border.subtle}`
          }}>
            <CardTitle style={{
              fontSize: typography.fontSize.h3,
              fontWeight: typography.fontWeight.semiBold,
              color: themeColors.text.primary
            }}>New project</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: spacing.lg }}>
            <form onSubmit={create}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
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

              <div style={{ marginTop: spacing.lg }}>
                <div style={{ fontWeight: typography.fontWeight.medium, marginBottom: spacing.md }}>
                  Storage Policy
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: spacing.md }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      Hot storage
                      <Input
                        type="number"
                        value={storagePolicy.hot_days}
                        onChange={(e) => setStoragePolicy(s => ({ ...s, hot_days: parseInt(e.target.value) || 30 }))}
                        min="1"
                        max="365"
                        style={{ width: 80 }}
                      />
                      <span style={{ fontSize: typography.fontSize.caption, color: themeColors.text.muted }}>days</span>
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      Warm storage
                      <Input
                        type="number"
                        value={storagePolicy.warm_days}
                        onChange={(e) => setStoragePolicy(s => ({ ...s, warm_days: parseInt(e.target.value) || 90 }))}
                        min="1"
                        max="365"
                        style={{ width: 80 }}
                      />
                      <span style={{ fontSize: typography.fontSize.caption, color: themeColors.text.muted }}>days</span>
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                      Cold storage
                      <Input
                        type="number"
                        value={storagePolicy.cold_days}
                        onChange={(e) => setStoragePolicy(s => ({ ...s, cold_days: parseInt(e.target.value) || 365 }))}
                        min="1"
                        max="365"
                        style={{ width: 80 }}
                      />
                      <span style={{ fontSize: typography.fontSize.caption, color: themeColors.text.muted }}>days</span>
                    </label>
                  </div>
                </div>
                <div style={{ marginTop: spacing.md, display: 'flex', alignItems: 'center', gap: spacing.md }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <Input
                      type="checkbox"
                      checked={storagePolicy.enabled}
                      onChange={(e) => setStoragePolicy(s => ({ ...s, enabled: e.target.checked }))}
                    />
                    Enable storage lifecycle policy
                  </label>
                </div>
              </div>

              <div style={{ marginTop: spacing.lg, display: 'flex', justifyContent: 'flex-end', gap: spacing.md }}>
                <Button variant="outline" size="sm" onClick={() => {
                  setName("");
                  setDesc("");
                  setStoragePolicy({
                    hot_days: 30,
                    warm_days: 90,
                    cold_days: 365,
                    enabled: true
                  });
                }}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Create repo
                </Button>
                {error && (
                  <div style={{ marginLeft: spacing.md, color: themeColors.error, fontSize: typography.fontSize.caption }}>
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