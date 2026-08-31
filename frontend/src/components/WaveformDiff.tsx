import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import { fmtClock } from "./ReviewShared";

interface WaveformDiffProps {
  sessionId: number;
  baseVersionId: number;
  compareVersionId: number;
  onClose: () => void;
}

interface DiffData {
  base: { version_id: number; label: string; peaks: number[]; duration_s: number };
  compare: { version_id: number; label: string; peaks: number[]; duration_s: number };
  diff_peaks: number[];
}

type DiffMode = "overlay" | "side-by-side" | "difference";

const COLORS = {
  base: "#3b82f6",
  compare: "#a855f7",
  diff: "#ef4444",
  background: "var(--bg-elevated)",
  grid: "var(--border-default)",
};

export default function WaveformDiff({
  sessionId,
  baseVersionId,
  compareVersionId,
  onClose,
}: WaveformDiffProps) {
  const [data, setData] = useState<DiffData | null>(null);
  const [mode, setMode] = useState<DiffMode>("overlay");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const d = await api.getWaveformDiff(sessionId, baseVersionId, compareVersionId);
      setData(d);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load waveform diff");
    } finally {
      setLoading(false);
    }
  }, [sessionId, baseVersionId, compareVersionId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const mid = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let y = 0; y < h; y += h / 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const drawWave = (peaks: number[], color: string, alpha: number = 1) => {
      if (peaks.length === 0) return;
      const step = w / peaks.length;
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      for (let i = 0; i < peaks.length; i++) {
        const x = i * step;
        const barH = peaks[i] * mid * 0.9;
        ctx.fillRect(x, mid - barH, Math.max(step - 0.5, 1), barH * 2);
      }
      ctx.globalAlpha = 1;
    };

    if (mode === "overlay") {
      drawWave(data.base.peaks, COLORS.base, 0.6);
      drawWave(data.compare.peaks, COLORS.compare, 0.6);
    } else if (mode === "side-by-side") {
      // Left half = base, right half = compare
      const halfW = w / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, halfW, h);
      ctx.clip();
      drawWave(data.base.peaks, COLORS.base, 0.8);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(halfW, 0, halfW, h);
      ctx.clip();
      // Shift compare peaks to fit right half
      const shiftedPeaks = data.compare.peaks;
      const shiftStep = (halfW) / shiftedPeaks.length;
      ctx.fillStyle = COLORS.compare;
      ctx.globalAlpha = 0.8;
      for (let i = 0; i < shiftedPeaks.length; i++) {
        const x = halfW + i * shiftStep;
        const barH = shiftedPeaks[i] * mid * 0.9;
        ctx.fillRect(x, mid - barH, Math.max(shiftStep - 0.5, 1), barH * 2);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Divider line
      ctx.strokeStyle = COLORS.compare;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, h);
      ctx.stroke();
    } else if (mode === "difference") {
      drawWave(data.diff_peaks, COLORS.diff, 0.9);
    }

    // Playhead
    if (data.base.duration_s > 0) {
      const pct = position / data.base.duration_s;
      const px = pct * w;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
  }, [data, mode, position]);

  // Audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tick = () => {
      if (audio && !audio.paused) {
        setPosition(audio.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !data) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    // Use the base version audio
    try {
      audio.src = api.versionAudioUrl(sessionId, data.base.version_id);
      await audio.play();
      setPlaying(true);
    } catch {
      /* ignore */
    }
  };

  const duration = data?.base.duration_s ?? 0;
  const pct = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-md)",
        padding: 16,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)" }}>
            Waveform Diff
          </span>
          {data && (
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {data.base.label} ↔ {data.compare.label}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 16 }}
        >
          ×
        </button>
      </div>

      {/* Mode picker */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {(["overlay", "side-by-side", "difference"] as DiffMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              background: mode === m ? "var(--brand-primary)" : "var(--bg-elevated)",
              color: mode === m ? "#fff" : "var(--text-primary)",
              border: `1px solid ${mode === m ? "var(--brand-primary)" : "var(--border-default)"}`,
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {m === "side-by-side" ? "Side by Side" : m === "difference" ? "Difference" : "Overlay"}
          </button>
        ))}
      </div>

      {/* Legend */}
      {mode === "overlay" && (
        <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 11 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: COLORS.base, display: "inline-block" }} />
            {data?.base.label}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: COLORS.compare, display: "inline-block" }} />
            {data?.compare.label}
          </span>
        </div>
      )}

      {/* Canvas */}
      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          style={{ width: "100%", height: 120, borderRadius: 4, cursor: "pointer" }}
          onClick={(e) => {
            if (!audioRef.current || !data) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            audioRef.current.currentTime = pct * data.base.duration_s;
            setPosition(audioRef.current.currentTime);
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => void togglePlay()}
          disabled={!data}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--brand-primary)",
            color: "#fff",
            border: "none",
            cursor: data ? "pointer" : "default",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>
        <span style={{ fontSize: 12, color: "var(--text-secondary)", fontFamily: "monospace" }}>
          {fmtClock(position)} / {fmtClock(duration)}
        </span>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} preload="auto" onEnded={() => setPlaying(false)} />

      {loading && <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>Loading waveforms…</div>}
      {err && <div style={{ fontSize: 12, color: "var(--error)", marginTop: 8 }}>{err}</div>}
    </div>
  );
}
