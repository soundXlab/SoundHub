import React from "react";
import { useState } from "react";

interface MarketplaceTransportProps {
  totalAssets: number;
  freeAssets: number;
  newAssets: number;
  cartItems: number;
  wishlistItems: number;
}

export const MarketplaceTransport: React.FC<MarketplaceTransportProps> = ({
  totalAssets,
  freeAssets,
  newAssets,
  cartItems,
  wishlistItems,
}) => {
  return (
    <div className="marketplace-transport">
      <div className="transport-logo">Sound<span>Hub</span></div>
      <div className="transport-divider"></div>
      <div className="transport-group">
        <span className="transport-label">Assets</span>
        <div className="transport-value">{totalAssets}</div>
      </div>
      <div className="transport-group">
        <span className="transport-label">Free</span>
        <div className="transport-value" style={{ color: "#22c55e" }}>
          {freeAssets}
        </div>
      </div>
      <div className="transport-group">
        <span className="transport-label">New</span>
        <div className="transport-value" style={{ color: "#ea5808" }}>
          {newAssets}
        </div>
      </div>
      <div className="transport-spacer"></div>
      <div style={{ fontSize: "9px", color: "#555", letterSpacing: "0.5px" }}>
        MARKETPLACE
      </div>
      <div className="transport-spacer"></div>
      <div className="transport-group">
        <span className="transport-label">Cart</span>
        <div className="transport-value">{cartItems}</div>
      </div>
      <div className="transport-group">
        <span className="transport-label">Wish</span>
        <div className="transport-value">{wishlistItems}</div>
      </div>
    </div>
  );
};