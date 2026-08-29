import React from "react";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from "../components/ui";
import { Music, Play, Loader, List, Grid } from "lucide-react";
import AssetCard from "./AssetCard";
import SkeletonGrid from "./SkeletonGrid";
import EmptyState from "./EmptyState";
import ErrorMessage from "./ErrorMessage";
import type { CatalogAsset } from "../types";

interface AssetViewProps {
  view: "grid" | "list";
  catalog: CatalogAsset[];
  catalogLoading: boolean;
  catalogErr: string | null;
  playingId: number | null;
  onViewToggle: () => void;
  onTogglePlay: (asset: CatalogAsset) => void;
  onAssetDetail: (asset: CatalogAsset) => void;
  onAddAsset?: (asset: CatalogAsset) => void;
  onRemoveAsset?: (asset: CatalogAsset) => void;
}

export default function AssetView({
  view,
  catalog,
  catalogLoading,
  catalogErr,
  playingId,
  onViewToggle,
  onTogglePlay,
  onAssetDetail,
  onAddAsset,
  onRemoveAsset,
}: AssetViewProps) {
  if (catalogLoading) {
    return <SkeletonGrid />;
  }

  if (catalogErr) {
    return <ErrorMessage message={catalogErr} />;
  }

  if (catalog.length === 0) {
    return <EmptyState message="No assets found" />;
  }

  return (
    <div className={`asset-view view-${view}`}>
      <div className="asset-view-header">
        <h2>Browse {catalog.length} assets</h2>
        <Button variant="outline" size="sm" onClick={onViewToggle}>
          {view === "grid" ? (
            <>
              <List size={16} />
              List view
            </>
          ) : (
            <>
              <Grid size={16} />
              Grid view
            </>
          )}
        </Button>
      </div>
      {view === "grid" ? (
        <div className="asset-grid">
          {catalog.map((asset) => (
            <AssetCard
              key={asset.listing_id}
              asset={asset}
              isPlaying={playingId === asset.listing_id}
              onTogglePlay={onTogglePlay}
              onAssetDetail={onAssetDetail}
            />
          ))}
        </div>
      ) : (
        <div className="asset-list">
          {catalog.map((asset) => (
            <AssetCard
              key={asset.listing_id}
              asset={asset}
              isPlaying={playingId === asset.listing_id}
              onTogglePlay={onTogglePlay}
              onAssetDetail={onAssetDetail}
              view="list"
            />
          ))}
        </div>
      )}
    </div>
  );
}