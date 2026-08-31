import React from "react";

interface MarketplaceDeviceChainProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const MarketplaceDeviceChain: React.FC<MarketplaceDeviceChainProps> = ({
  activeView,
  onViewChange,
}) => {
  return (
    <div className="device-chain">
      <span style={{ fontSize: "8px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "8px" }}>
        Quick:
      </span>
      <div className={`device ${activeView === "Instruments" ? "active" : ""}`} onClick={() => onViewChange("Instruments")}>
        🎹 Instruments
      </div>
      <div className={`device ${activeView === "Effects" ? "active" : ""}`} onClick={() => onViewChange("Effects")}>
        🎛️ Effects
      </div>
      <div className={`device ${activeView === "Samples" ? "active" : ""}`} onClick={() => onViewChange("Samples")}>
        📦 Samples
      </div>
      <div className={`device ${activeView === "Presets" ? "active" : ""}`} onClick={() => onViewChange("Presets")}>
        🎚️ Presets
      </div>
      <div style={{ flex: 1 }}></div>
      <div className={`device ${activeView === "Grid" ? "active" : ""}`} onClick={() => onViewChange("Grid")}>
        Grid
      </div>
      <div className={`device ${activeView === "List" ? "active" : ""}`} onClick={() => onViewChange("List")}>
        List
      </div>
    </div>
  );
};