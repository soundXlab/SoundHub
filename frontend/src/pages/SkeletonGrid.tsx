import React from "react";

export default function SkeletonGrid() {
  const rows = [];
  for (let i = 0; i < 8; i++) {
    rows.push(<div key={i} className="skeleton-row" />);
  }
  return (
    <div className="skeleton-grid">
      {rows.map((row, index) => (
        <div key={index} className="skeleton-row">
          <div className="skeleton-item">
            <div className="skeleton-waveform" />
            <div className="skeleton-content">
              <div className="skeleton-line" style={{ width: "80%" }} />
              <div className="skeleton-line" style={{ width: "60%" }} />
              <div className="skeleton-line" style={{ width: "40%" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}