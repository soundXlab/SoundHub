import React, { useCallback, useEffect, useRef, useState } from "react";
import { FullPageLayout } from "../components/FullPageLayout";
import { api } from "../api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
} from "../components/ui";
import type { CatalogAsset } from "../types";
import { Folder, GitBranch, Zap, Shield, Truck, List, Grid } from "lucide-react";
import { useParams } from "react-router-dom";
import AssetCard from "./AssetCard";
import FilterPanel from "./FilterPanel";
import SortBar from "./SortBar";
import AssetView from "./AssetView";
import AssetCarousel from "./AssetCarousel";

interface Project {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  slug: string;
}

interface Branch {
  name: string;
  isDefault: boolean;
  headCommitId: number | null;
  headMessage: string;
  headSha: string | null;
  headAuthor: string;
  headDate: string | null;
  commitCount: number;
  createdAt: string;
}

interface Commit {
  id: number;
  message: string;
  authorId: number;
  author: {
    id: number;
    username: string;
    walletAddress: string | null;
  };
  createdAt: string;
  stats: {
    additions: number;
    deletions: number;
    files: number;
  };
}

interface AssetDependency {
  assetId: number;
  packageId: number;
  name: string;
  assetUri: string;
  price: string;
  license: number;
  author: string;
  bpmRange: [number, number];
  key: string;
  genres: string[];
  format: string;
  plugins: string[];
  durationSeconds: number;
  waveform: number[];
  firstUsedAt: string;
  lastUsedAt: string;
  usageCount: number;
  licenseStatus: string;
}

interface Recommendation {
  listingId: number;
  name: string;
  assetUri: string;
  price: string;
  license: number;
  active: boolean;
  seller: string;
  buyer: string;
  escrowed: number;
  released: boolean;
  author: string;
  bpmRange: [number, number];
  key: string;
  genres: string[];
  format: string;
  plugins: string[];
  durationSeconds: number;
  waveform: number[];
  inProject: boolean;
  reason: string;
}

interface ProjectStats {
  totalCommits: number;
  totalBranches: number;
  totalAssets: number;
  storageUsed: string;
}

function depToCatalog(a: AssetDependency): CatalogAsset {
  return {
    listing_id: a.assetId,
    name: a.name,
    price_snd: a.price,
    license: String(a.license),
    uri: a.assetUri,
    bpm: a.bpmRange,
    key: a.key,
    genres: a.genres,
    plugins: a.plugins,
    format: a.format,
    contents: '',
    description: '',
    verified: false,
    duration_seconds: a.durationSeconds,
    waveform: a.waveform,
  };
}

function recToCatalog(a: Recommendation): CatalogAsset {
  return {
    listing_id: a.listingId,
    name: a.name,
    price_snd: a.price,
    license: String(a.license),
    uri: a.assetUri,
    bpm: a.bpmRange,
    key: a.key,
    genres: a.genres,
    plugins: a.plugins,
    format: a.format,
    contents: '',
    description: a.reason,
    verified: false,
    duration_seconds: a.durationSeconds,
    waveform: a.waveform,
  };
}

export default function ProjectViewPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [assets, setAssets] = useState<AssetDependency[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    totalCommits: 0,
    totalBranches: 0,
    totalAssets: 0,
    storageUsed: "0 MB"
  });
  const [activeTab, setActiveTab] = useState<"overview" | "assets" | "branches" | "commits">("overview");
  const [filters, setFilters] = useState({
    q: "",
    genre: "",
    key: "",
    license: "",
    format: "",
    plugin: "",
    bpmMin: "",
    bpmMax: ""
  });
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const EMPTY_FILTERS = {
    q: "",
    genre: "",
    key: "",
    license: "",
    format: "",
    plugin: "",
    bpmMin: "",
    bpmMax: ""
  };

  const loadProjectData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch project data
      const projectResp = await api.get(`/api/projects/${projectId}`);
      setProject(projectResp.data);

      // Fetch branches
      const branchesResp = await api.get(`/api/projects/${projectId}/branches`);
      setBranches(branchesResp.data);

      // Fetch recent commits
      const commitsResp = await api.get(`/api/projects/${projectId}/commits?limit=10`);
      setCommits(commitsResp.data);

      // Fetch project stats
      const statsResp = await api.get(`/api/projects/${projectId}/stats`);
      setStats(statsResp.data);

      // Fetch project assets (dependencies)
      const assetsResp = await api.get(`/api/projects/${projectId}/assets`);
      setAssets(assetsResp.data);

      // Fetch recommendations
      const recommendationsResp = await api.get(`/api/projects/${projectId}/sounds/recommend`);
      setRecommendations(recommendationsResp.data);

    } catch (err) {
      setError("Failed to load project data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
  };

  const togglePlay = (asset: CatalogAsset) => {
    if (playingId === asset.listing_id) {
      audioRef.current?.pause();
      setPlayingId(null);
      setProgress(0);
      return;
    }
    audioRef.current?.pause();
    const audio = new Audio(asset.uri);
    audioRef.current = audio;
    setPlayingId(asset.listing_id);
    setProgress(0);
    audio.ontimeupdate = () =>
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    audio.onended = () => {
      setPlayingId(null);
      setProgress(0);
    };
    audio.play().catch(() => {
      setPlayingId(null);
      setProgress(0);
    });
  };

  const handleAddAsset = async (asset: CatalogAsset) => {
    try {
      await api.post(`/api/projects/${projectId}/assets`, {
        asset_id: asset.listing_id,
        commit_message: `Add asset via UI`
      });
      // Refresh assets list
      const assetsResp = await api.get(`/api/projects/${projectId}/assets`);
      setAssets(assetsResp.data);
    } catch (err) {
      console.error("Failed to add asset:", err);
      alert("Failed to add asset to project");
    }
  };

  const handleRemoveAsset = async (asset: CatalogAsset) => {
    if (!window.confirm("Are you sure you want to remove this asset from the project?")) {
      return;
    }
    try {
      await api.delete(`/api/projects/${projectId}/assets/${asset.listing_id}`);
      // Refresh assets list
      const assetsResp = await api.get(`/api/projects/${projectId}/assets`);
      setAssets(assetsResp.data);
    } catch (err) {
      console.error("Failed to remove asset:", err);
      alert("Failed to remove asset from project");
    }
  };

  const handleReleasePreflight = async () => {
    try {
      const result = await api.post(`/api/projects/${projectId}/release/preflight`);
      if (result.data.validForRelease) {
        alert("Project is ready for release! All assets have valid licenses.");
      } else {
        let message = "Release blocked due to the following issues:\n\n";
        result.data.issues.forEach((issue: string) => {
          message += `• ${issue}\n`;
        });
        if (result.data.warnings.length > 0) {
          message += "\nWarnings:\n";
          result.data.warnings.forEach((warning: string) => {
            message += `• ${warning}\n`;
          });
        }
        alert(message);
      }
    } catch (err) {
      console.error("Failed to run preflight check:", err);
      alert("Failed to run release preflight check");
    }
  };

  if (loading) {
    return (
      <FullPageLayout activeSection="projects">
        <div className="project-view-page">
          <div className="project-view-header">
            <h1>Loading project...</h1>
          </div>
        </div>
      </FullPageLayout>
    );
  }

  if (error) {
    return (
      <FullPageLayout activeSection="projects">
        <div className="project-view-page">
          <div className="project-view-header">
            <h1>Error loading project</h1>
            <p>{error}</p>
            <Button variant="outline" onClick={loadProjectData}>
              Try again
            </Button>
          </div>
        </div>
      </FullPageLayout>
    );
  }

  if (!project) {
    return (
      <FullPageLayout activeSection="projects">
        <div className="project-view-page">
          <div className="project-view-header">
            <h1>Project not found</h1>
            <p>The requested project does not exist or you don't have access to it.</p>
          </div>
        </div>
      </FullPageLayout>
    );
  }

  return (
    <FullPageLayout activeSection="projects">
      <div className="project-view-page">
        <div className="project-view-header">
          <h1>{project.name}</h1>
          <p className="project-description">{project.description || "No description provided"}</p>
          <div className="project-meta">
            <span>Owner: #{project.ownerId}</span>
            <span>•</span>
            <span>Updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="project-view-tabs">
          <div className="tabs-list" style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {(['overview', 'assets', 'branches', 'commits'] as const).map(tab => (
              <button
                key={tab}
                className={`tab-trigger ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeTab === tab ? 'var(--brand-primary)' : 'var(--bg-secondary)', color: activeTab === tab ? '#fff' : 'var(--text-secondary)' }}
              >
                {tab === 'overview' && <Folder size={14} />}
                {tab === 'assets' && <List size={14} />}
                {tab === 'branches' && <GitBranch size={14} />}
                {tab === 'commits' && <Zap size={14} />}
                {' '}{tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
              <div className="project-overview">
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>{stats.totalCommits}</h3>
                    <p>Commits</p>
                  </div>
                  <div className="stat-card">
                    <h3>{stats.totalBranches}</h3>
                    <p>Branches</p>
                  </div>
                  <div className="stat-card">
                    <h3>{stats.totalAssets}</h3>
                    <p>Assets</p>
                  </div>
                  <div className="stat-card">
                    <h3>{stats.storageUsed}</h3>
                    <p>Storage</p>
                  </div>
                </div>

                <div className="project-actions">
                  <Button onClick={handleReleasePreflight}>
                    <Shield /> Release Preflight Check
                  </Button>
                </div>

                <div className="recent-activity">
                  <h3>Recent Commits</h3>
                  {commits.length > 0 ? (
                    commits.map(commit => (
                      <div key={commit.id} className="commit-item">
                        <div className="commit-header">
                          <span className="commit-sha">#{commit.id}</span>
                          <span className="commit-author">{commit.author.username}</span>
                          <span className="commit-date">{new Date(commit.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="commit-message">{commit.message}</p>
                        <div className="commit-stats">
                          <span>{commit.stats.files} files changed</span>
                          <span>{commit.stats.additions} additions</span>
                          <span>{commit.stats.deletions} deletions</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No commits yet</p>
                  )}
                </div>
              </div>
            )}

          {activeTab === 'assets' && (
              <div className="project-assets-view">
                <div className="assets-toolbar">
                  <div className="assets-search">
                    <Input
                      placeholder="Search assets..."
                      value={filters.q}
                      onChange={(e) => handleFilterChange('q', e.target.value)}
                    />
                  </div>

                  <div className="assets-actions">
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Clear filters
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
                    >
                      {view === 'grid' ? (
                        <>
                          <List size={16} />
                          List view
                        </>
                      ) : (
                        <>
                          <Grid size={16} />
                          Grid view
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="assets-filters">
                  <FilterPanel
                    filters={filters}
                    genreOptions={Array.from(new Set((assets as any[]).flatMap((a: any) => a.genres || []))).sort()}
                    keyOptions={Array.from(new Set(assets.filter(a => a.key).map(a => a.key))).sort()}
                    licenseOptions={Array.from(new Set(assets.map(a => String(a.license)))).sort()}
                    formatOptions={Array.from(new Set(assets.filter(a => a.format).map(a => a.format))).sort()}
                    pluginOptions={Array.from(new Set(assets.flatMap(a => a.plugins))).sort()}
                    onFilterChange={handleFilterChange}
                    onResetFilters={resetFilters}
                  />
                </div>

                <div className="assets-main">
                  <AssetView
                    view={view}
                    catalog={assets.map(depToCatalog)}
                    catalogLoading={false}
                    catalogErr={null}
                    playingId={playingId}
                    onViewToggle={() => setView(view === 'grid' ? 'list' : 'grid')}
                    onTogglePlay={togglePlay}
                    onAssetDetail={(asset) => {
                      window.location.href = `/market`;
                    }}
                  />

                  {recommendations.length > 0 && (
                    <div className="recommendations-aside">
                      <h3>Recommended for your project</h3>
                      <AssetCarousel
                        assets={recommendations.map(recToCatalog)}
                        onTogglePlay={togglePlay}
                        onAssetDetail={(asset) => {
                          window.location.href = `/market`;
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

          {activeTab === 'branches' && (
              <div className="project-branches-view">
                <div className="branches-toolbar">
                  <Button onClick={() => {
                    // TODO: Implement branch creation modal
                    alert("Branch creation modal would go here");
                  }}>
                    <GitBranch size={16} /> New Branch
                  </Button>
                </div>

                <div className="branches-list">
                  {branches.length > 0 ? (
                    branches.map(branch => (
                      <div key={branch.name} className="branch-item">
                        <div className="branch-header">
                          <h4>
                            {branch.name}
                            {branch.isDefault && (
                              <span className="branch-default">(default)</span>
                            )}
                          </h4>
                          <div className="branch-meta">
                            <span>{branch.commitCount} commits</span>
                            <span>•</span>
                            <span>{branch.headAuthor}</span>
                            <span>•</span>
                            <span>{branch.headDate ? new Date(branch.headDate).toLocaleString() : '—'}</span>
                          </div>
                        </div>
                        <p className="branch-message">{branch.headMessage}</p>
                      </div>
                    ))
                  ) : (
                    <p>No branches found</p>
                  )}
                </div>
              </div>
            )}

          {activeTab === 'commits' && (
              <div className="project-commits-view">
                <div className="commits-toolbar">
                  <Button onClick={() => {
                    // TODO: Implement commit creation
                    alert("Commit creation would go here");
                  }}>
                    <Zap size={16} /> New Commit
                  </Button>
                </div>

                <div className="commits-list">
                  {commits.length > 0 ? (
                    commits.map(commit => (
                      <div key={commit.id} className="commit-item">
                        <div className="commit-header">
                          <span className="commit-sha">#{commit.id}</span>
                          <span className="commit-author">{commit.author.username}</span>
                          <span className="commit-date">{new Date(commit.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="commit-message">{commit.message}</p>
                        <div className="commit-stats">
                          <span>{commit.stats.files} files changed</span>
                          <span>{commit.stats.additions} +</span>
                          <span>{commit.stats.deletions} -</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>No commits found</p>
                  )}
                </div>
              </div>
            )}
        </div>
      </div>
    </FullPageLayout>
  );
}