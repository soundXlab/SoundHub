import React from "react";

interface MarketplaceBrowserProps {
  onSearchChange: (value: string) => void;
  activeCollection: string;
  onCollectionChange: (collection: string) => void;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  activeDAW: string;
  onDAWChange: (daw: string) => void;
  activeFormat: string;
  onFormatChange: (format: string) => void;
}

export const MarketplaceBrowser: React.FC<MarketplaceBrowserProps> = ({
  onSearchChange,
  activeCollection,
  onCollectionChange,
  activeCategory,
  onCategoryChange,
  activeDAW,
  onDAWChange,
  activeFormat,
  onFormatChange,
}) => {
  return (
    <div className="marketplace-browser">
      <div className="browser-search">
        <input
          type="text"
          placeholder="Search assets..."
          value={""}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="browser-section">Collections</div>
      <div className="browser-item">
        <span className="icon">★</span> Featured
      </div>
      <div className="browser-item">
        <span className="icon">🆕</span> New Releases
      </div>
      <div className="browser-item">
        <span className="icon">🔥</span> Trending
      </div>
      <div className="browser-item">
        <span className="icon">💰</span> Under $10
      </div>
      <div className="browser-divider"></div>
      <div className="browser-section">Categories</div>
      <div className={`browser-item ${activeCategory === "" ? "active" : ""}`}>
        <span className="icon">🎹</span> All
      </div>
      <div className={`browser-item ${activeCategory === "Instruments" ? "active" : ""}`}>
        <span className="icon">🎹</span> Instruments
      </div>
      <div className={`browser-item ${activeCategory === "Effects" ? "active" : ""}`}>
        <span className="icon">🎛️</span> Effects
      </div>
      <div className={`browser-item ${activeCategory === "Sample Packs" ? "active" : ""}`}>
        <span className="icon">📦</span> Sample Packs
      </div>
      <div className={`browser-item ${activeCategory === "Presets" ? "active" : ""}`}>
        <span className="icon">🎚️</span> Presets
      </div>
      <div className={`browser-item ${activeCategory === "Loops" ? "active" : ""}`}>
        <span className="icon">🎵</span> Loops
      </div>
      <div className={`browser-item ${activeCategory === "Drums" ? "active" : ""}`}>
        <span className="icon">🥁</span> Drums
      </div>
      <div className="browser-divider"></div>
      <div className="browser-section">DAW</div>
      <div className={`browser-item ${activeDAW === "All" ? "active" : ""}`}>
        <span className="icon">🎵</span> All
      </div>
      <div className={`browser-item ${activeDAW === "Ableton Live" ? "active" : ""}`}>
        <span className="icon">🎵</span> Ableton Live
      </div>
      <div className={`browser-item ${activeDAW === "FL Studio" ? "active" : ""}`}>
        <span className="icon">🎹</span> FL Studio
      </div>
      <div className={`browser-item ${activeDAW === "Logic Pro" ? "active" : ""}`}>
        <span className="icon">🎸</span> Logic Pro
      </div>
      <div className={`browser-item ${activeDAW === "REAPER" ? "active" : ""}`}>
        <span className="icon">🎛️</span> REAPER
      </div>
      <div className="browser-divider"></div>
      <div className="browser-section">Formats</div>
      <div className={`browser-item ${activeFormat === "All" ? "active" : ""}`}>
        <span className="icon">📦</span> All
      </div>
      <div className={`browser-item ${activeFormat === "VST3" ? "active" : ""}`}>
        <span className="icon">📦</span> VST3
      </div>
      <div className={`browser-item ${activeFormat === "AU" ? "active" : ""}`}>
        <span className="icon">📦</span> AU
      </div>
      <div className={`browser-item ${activeFormat === "AAX" ? "active" : ""}`}>
        <span className="icon">📦</span> AAX
      </div>
      <div className={`browser-item ${activeFormat === "CLAP" ? "active" : ""}`}>
        <span className="icon">📦</span> CLAP
      </div>
    </div>
  );
};