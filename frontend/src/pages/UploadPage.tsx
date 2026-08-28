import React, { useCallback, useRef, useState, useEffect, type FormEvent } from 'react';
import { FullPageLayout } from '../components/FullPageLayout';
import { api } from '../api';
import type { Project } from '../types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
} from '../components/ui';
import { Upload, FileAudio, FileCode, Check, X, Music, Folder, AlertCircle, Loader } from 'lucide-react';

interface UploadedFile {
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress?: number;
  error?: string;
}

const ACCEPTED = '.wav,.mp3,.flac,.aiff,.als,.flp,.cpr,.rpp,.mid,.zip,.rar';

const isAudio = (name: string) => /\.(wav|mp3|flac|aiff|aif|ogg|m4a)$/i.test(name);
const isDaw = (name: string) => /\.(als|flp|cpr|rpp|mid)$/i.test(name);
const isArchive = (name: string) => /\.(zip|rar|7z)$/i.test(name);

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UploadPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.listProjects().then(setProjects).catch(() => {});
  }, []);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    setFiles(prev => [...prev, ...arr.map(f => ({ file: f, status: 'pending' as const }))]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadAll = async () => {
    if (!selectedProjectId || files.length === 0) return;
    setIsUploading(true);

    // Mark all as uploading
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

    try {
      const fileList = files.map(f => f.file);
      await api.createCommit(
        selectedProjectId,
        commitMessage || `Upload ${fileList.length} file(s)`,
        fileList,
        'main'
      );

      // Mark all as done
      setFiles(prev => prev.map(f => ({ ...f, status: 'done' as const })));
      setCommitMessage('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setFiles(prev => prev.map(f =>
        f.status === 'uploading' ? { ...f, status: 'error' as const, error: msg } : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <FullPageLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '16px' }}>
        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription>
              Upload audio files or DAW projects to a project repo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Project selector */}
            <Card>
              <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Folder size={12} style={{ color: 'var(--brand-primary)' }} />
                  <CardTitle>Target Project</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <CardDescription>
                    No projects found. Create one in <a href="/projects" style={{ color: 'var(--brand-primary)' }}>Projects</a>.
                  </CardDescription>
                ) : (
                  <select
                    value={selectedProjectId ?? ''}
                    onChange={(e) => setSelectedProjectId(e.target.value ? Number(e.target.value) : null)}
                    style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: '14px' }}
                  >
                    <option value="">— Select project —</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </CardContent>
            </Card>

            {/* Drop zone */}
            <Card>
              <CardHeader>
                <CardTitle>Drop Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  style={{
                    border: `2px dashed ${!selectedProjectId ? 'var(--border-default)' : isDragging ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '40px 20px',
                    textAlign: 'center',
                    cursor: !selectedProjectId ? 'not-allowed' : 'pointer',
                    background: isDragging ? 'var(--brand-muted)' : 'var(--bg-elevated)',
                    transition: 'all 0.15s',
                    marginBottom: '12px',
                    opacity: !selectedProjectId ? 0.5 : 1,
                  }}
                >
                  <Upload size={32} style={{ color: isDragging ? 'var(--brand-primary)' : 'var(--text-muted)', marginBottom: '10px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 600, color: isDragging ? 'var(--brand-primary)' : 'var(--text-primary)', marginBottom: '4px' }}>
                    {!selectedProjectId ? 'Select a project first' : isDragging ? 'Drop files here' : 'Click or drag files here'}
                  </div>
                  <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>
                    Audio: .wav .mp3 .flac .aiff &nbsp;|&nbsp; DAW: .als .flp .cpr .rpp .mid &nbsp;|&nbsp; Archives: .zip .rar
                  </div>
                  <input
                    ref={inputRef} type="file" multiple accept={ACCEPTED}
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                    style={{ display: 'none' }}
                    disabled={!selectedProjectId}
                  />
                </div>
              </CardContent>
            </Card>

            {/* File list */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <CardTitle>
                      <span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {files.length} file(s)
                        </span>
                        {doneCount > 0 && <span style={{ fontSize: '15px', color: 'var(--success)' }}>{doneCount} done</span>}
                        {errorCount > 0 && <span style={{ fontSize: '15px', color: 'var(--error)' }}>{errorCount} failed</span>}
                      </span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
                      Clear all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {files.map((f, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 18px', borderBottom: i < files.length - 1 ? `1px solid var(--border-default)` : 'none',
                    }}>
                      {f.status === 'uploading' && <Loader size={12} style={{ color: 'var(--warning)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />}
                      {f.status === 'done' && <Check size={12} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                      {f.status === 'error' && <AlertCircle size={12} style={{ color: 'var(--error)', flexShrink: 0 }} />}
                      {f.status === 'pending' && (
                        isAudio(f.file.name) ? <FileAudio size={12} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                        : isDaw(f.file.name) ? <FileCode size={12} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                        : <Music size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '14px', color: f.status === 'error' ? 'var(--error)' : 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {f.file.name}
                        </div>
                        <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                          {formatSize(f.file.size)}
                          {f.error && <span style={{ color: 'var(--error)' }}> — {f.error}</span>}
                        </div>
                      </div>
                      {f.status === 'pending' && (
                        <Button variant="ghost" size="sm" onClick={() => removeFile(i)}>
                          <X size={12} />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Commit message + upload button */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Commit Message (optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    type="text"
                    placeholder="Commit message (optional)"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    style={{ width: '100%', marginBottom: '10px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={uploadAll}
                      disabled={!selectedProjectId || pendingCount === 0 || isUploading}
                      style={{
                        padding: '6px 16px',
                        fontFamily: 'inherit',
                        opacity: !selectedProjectId || pendingCount === 0 || isUploading ? 0.5 : 1,
                        display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                    >
                      {isUploading ? <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={10} />}
                      {isUploading ? 'Uploading...' : `Upload ${pendingCount} file(s)`}
                    </Button>
                    {selectedProject && (
                      <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                        → {selectedProject.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </FullPageLayout>
  );
}