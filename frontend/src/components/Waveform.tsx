import React from "react";

interface WaveformProps {
  peaks: number[];
  progress: number;
  playing: boolean;
}

export default function Waveform({ peaks, progress, playing }: WaveformProps) {
  const bars = peaks.length ? peaks : Array.from({ length: 120 }, () => 12);
  return (
    <div className="waveform" aria-hidden="true">
      {bars.map((p, i) => (
        <span
          key={i}
          className={`wf-bar${playing && i / bars.length <= progress ? " played" : ""}`}
          style={{ height: `${Math.max(6, Math.round((p / 255) * 100))}%` }}
        />
      ))}
    </div>
  );
}