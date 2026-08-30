import { useState, useRef, useCallback } from "react";
import { Package, X, Check, AlertCircle, Loader } from "lucide-react";

interface ALPFile {
  file: File;
  status: "pending" | "uploading" | "extracting" | "done" | "error";
  progress?: number;
  error?: string;
  extractedCount?: number;
}

interface BatchALPImportProps {
  projectId: number;
  branch: string;
  onImportComplete: () => void;
}

export default function BatchALPImport({
  projectId,
  branch,
  onImportComplete,
}: BatchALPImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<ALPFile[]>([]);
  const [importing, setImporting] = useState(false);
  const [currentFile, setCurrentFile] = useState<number>(-1);
  const [summary, setSummary] = useState<{
    total: number;
    success: number;
    failed: number;
    totalExtracted: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;

      const alpFiles: ALPFile[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (file.name.toLowerCase().endsWith(".alp")) {
          alpFiles.push({ file, status: "pending" });
        }
      }

      if (alpFiles.length === 0) {
        alert("No .alp files found in the selected folder.");
        return;
      }

      setFiles(alpFiles);
      setSummary(null);
    },
    []
  );

  const handleFilesSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;

      const alpFiles: ALPFile[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        if (file.name.toLowerCase().endsWith(".alp")) {
          alpFiles.push({ file, status: "pending" });
        }
      }

      if (alpFiles.length === 0) {
        alert("Please select .alp files only.");
        return;
      }

      setFiles(alpFiles);
      setSummary(null);
    },
    []
  );

  const startImport = async () => {
    if (files.length === 0) return;

    setImporting(true);
    let successCount = 0;
    let failedCount = 0;
    let totalExtracted = 0;

    for (let i = 0; i < files.length; i++) {
      setCurrentFile(i);
      const alpFile = files[i];

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: "uploading" } : f))
      );

      try {
        // Create FormData for this file
        const formData = new FormData();
        formData.append("message", `Batch import: ${alpFile.file.name}`);
        formData.append("branch", branch);
        formData.append("files", alpFile.file, alpFile.file.name);

        // Upload the file
        const response = await fetch(
          `/api/projects/${projectId}/commits`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();

        // Update status to done
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? { ...f, status: "done", extractedCount: result.file_count || 0 }
              : f
          )
        );

        successCount++;
        totalExtracted += result.file_count || 0;
      } catch (error) {
        // Update status to error
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: "error",
                  error: error instanceof Error ? error.message : "Unknown error",
                }
              : f
          )
        );
        failedCount++;
      }
    }

    setSummary({
      total: files.length,
      success: successCount,
      failed: failedCount,
      totalExtracted,
    });

    setImporting(false);
    setCurrentFile(-1);

    if (successCount > 0) {
      onImportComplete();
    }
  };

  const reset = () => {
    setFiles([]);
    setSummary(null);
    setCurrentFile(-1);
    setImporting(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) {
    return (
      <button
        className="batch-alp-trigger"
        onClick={() => setIsOpen(true)}
      >
        <Package size={14} />
        <span>Batch ALP Import</span>
      </button>
    );
  }

  return (
    <div className="batch-alp-container">
      <div className="batch-alp-header">
        <h3 className="batch-alp-title">
          <Package size={16} />
          Batch ALP Import
        </h3>
        <button
          className="batch-alp-close"
          onClick={() => {
            setIsOpen(false);
            reset();
          }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="batch-alp-body">
        {/* Selection area */}
        {files.length === 0 && !summary && (
          <div className="batch-alp-select">
            <div className="batch-alp-select-actions">
              <button
                className="batch-alp-btn"
                onClick={() => folderInputRef.current?.click()}
              >
                <Package size={14} />
                Select Folder with ALP Files
              </button>
              <span className="batch-alp-or">or</span>
              <button
                className="batch-alp-btn batch-alp-btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Select ALP Files
              </button>
            </div>
            <p className="batch-alp-hint">
              Scan a folder for .alp files or select multiple .alp files directly
            </p>

            <input
              ref={folderInputRef}
              type="file"
              // @ts-expect-error - webkitdirectory is non-standard
              webkitdirectory=""
              directory=""
              multiple
              hidden
              onChange={handleFolderSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".alp"
              hidden
              onChange={handleFilesSelect}
            />
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="batch-alp-files">
            <div className="batch-alp-files-header">
              <span className="batch-alp-files-count">
                {files.length} ALP file(s) selected
              </span>
              {!importing && !summary && (
                <button className="batch-alp-btn batch-alp-btn-sm" onClick={reset}>
                  Clear
                </button>
              )}
            </div>

            <div className="batch-alp-files-list">
              {files.map((f, idx) => (
                <div
                  key={idx}
                  className={`batch-alp-file-row batch-alp-file-${f.status}`}
                >
                  <div className="batch-alp-file-icon">
                    {f.status === "pending" && <Package size={12} />}
                    {f.status === "uploading" && (
                      <Loader size={12} className="batch-alp-spin" />
                    )}
                    {f.status === "done" && <Check size={12} />}
                    {f.status === "error" && <AlertCircle size={12} />}
                  </div>
                  <div className="batch-alp-file-info">
                    <span className="batch-alp-file-name">{f.file.name}</span>
                    <span className="batch-alp-file-size">
                      {formatSize(f.file.size)}
                    </span>
                  </div>
                  {f.status === "done" && f.extractedCount && (
                    <span className="batch-alp-file-extracted">
                      {f.extractedCount} files
                    </span>
                  )}
                  {f.status === "error" && (
                    <span className="batch-alp-file-error">{f.error}</span>
                  )}
                  {importing && currentFile === idx && (
                    <div className="batch-alp-progress-bar">
                      <div className="batch-alp-progress-fill" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Start button */}
            {!importing && !summary && (
              <button
                className="batch-alp-btn batch-alp-btn-primary"
                onClick={startImport}
              >
                Import {files.length} ALP File(s)
              </button>
            )}
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div className="batch-alp-summary">
            <div className="batch-alp-summary-header">
              <Check size={16} />
              <span>Import Complete</span>
            </div>
            <div className="batch-alp-summary-stats">
              <div className="batch-alp-stat">
                <span className="batch-alp-stat-value">{summary.total}</span>
                <span className="batch-alp-stat-label">Total</span>
              </div>
              <div className="batch-alp-stat batch-alp-stat-success">
                <span className="batch-alp-stat-value">{summary.success}</span>
                <span className="batch-alp-stat-label">Success</span>
              </div>
              {summary.failed > 0 && (
                <div className="batch-alp-stat batch-alp-stat-failed">
                  <span className="batch-alp-stat-value">{summary.failed}</span>
                  <span className="batch-alp-stat-label">Failed</span>
                </div>
              )}
              <div className="batch-alp-stat">
                <span className="batch-alp-stat-value">
                  {summary.totalExtracted}
                </span>
                <span className="batch-alp-stat-label">Files Extracted</span>
              </div>
            </div>
            <button
              className="batch-alp-btn batch-alp-btn-secondary"
              onClick={reset}
            >
              Import More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
