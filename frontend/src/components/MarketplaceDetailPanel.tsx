import React from "react";

interface MarketplaceDetailPanelProps {
  totalAssets: number;
  freeAssets: number;
  newAssets: number;
  topRated: string;
  trending: string[];
  tags: string[];
}

export const MarketplaceDetailPanel: React.FC<MarketplaceDetailPanelProps> = ({
  totalAssets,
  freeAssets,
  newAssets,
  topRated,
  trending,
  tags,
}) => {
  return (
    <div className="detail-panel">
      <div className="detail-title">🛒 Marketplace</div>
      <div className="detail-row">
        <div className="detail-label">Total Assets</div>
        <div className="detail-value">{totalAssets}</div>
      </div>
      <div className="detail-row">
        <div className="detail-label">Free</div>
        <div className="detail-value" style={{ color: "#22c55e" }}>
          {freeAssets}
        </div>
      </div>
      <div className="detail-row">
        <div className="detail-label">New This Week</div>
        <div className="detail-value" style={{ color: "#ea5808" }}>
          {newAssets}
        </div>
      </div>
      <div className="detail-row">
        <div className="detail-label">Top Rated</div>
        <div className="detail-value" style={{ color: "#eab308" }}>
          {topRated}
        </div>
      </div>
      <div style={{ marginTop: "10px" }}>
        <div className="detail-title">🔥 Trending</div>
        {trending.map((item, index) => (
          <div
            key={index}
            style={{
              fontSize: "9px",
              color: "#888",
              padding: "3px 0",
              borderBottom: index < trending.length - 1 ? "1px solid #222" : "none",
            }}
          >
            {item}
          </div>
        ))}
      </div>
      <div style={{ marginTop: "10px" }}>
        <div className="detail-title">🏷️ Tags</div>
        <div className="detail-tags">
          {tags.map((tag, index) => (
            <div key={tag} className="detail-tag">
              {tag}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};