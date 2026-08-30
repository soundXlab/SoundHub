import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui";
import { Play, Music } from "lucide-react";
import AssetCard from "./AssetCard";
import type { CatalogAsset } from "../types";

interface AssetCarouselProps {
  assets: CatalogAsset[];
  onTogglePlay: (asset: CatalogAsset) => void;
  onAssetDetail: (asset: CatalogAsset) => void;
}

export default function AssetCarousel({ assets, onTogglePlay, onAssetDetail }: AssetCarouselProps) {
  if (assets.length === 0) {
    return <div className="asset-carousel-empty">No recommendations</div>;
  }

  return (
    <div className="asset-carousel">
      <div className="asset-carousel-track">
        {assets.map((asset) => (
          <AssetCard
            key={asset.listing_id}
            asset={asset}
            isPlaying={false} // recommendations are not played by default
            onTogglePlay={onTogglePlay}
            onAssetDetail={onAssetDetail}
            view="list" // or maybe a compact view?
          />
        ))}
      </div>
    </div>
  );
}