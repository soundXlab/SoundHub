import React from "react";
import { Card, CardContent, CardFooter, Badge, Button } from "../components/ui";
import { Play, Music, FileText } from "lucide-react";
import Waveform from "../components/Waveform";
import { formatEther } from "ethers";
import type { CatalogAsset } from "../types";

interface AssetCardProps {
  asset: CatalogAsset;
  isPlaying: boolean;
  onTogglePlay: (asset: CatalogAsset) => void;
  onAssetDetail: (asset: CatalogAsset) => void;
  view?: "grid" | "list";
}

export default function AssetCard({
  asset,
  isPlaying,
  onTogglePlay,
  onAssetDetail,
  view = "grid",
}: AssetCardProps) {
  const { name, bpm, key, genres, price_snd, license, waveform, uri } = asset;

  // Determine if it's free based on price or license
  const isFree = price_snd === "0" || license.toLowerCase().includes("free");

  // Determine license type for display
  const licenseType = license.toLowerCase();
  const isPaidLicense = licenseType.includes("paid") || licenseType.includes("commercial") || licenseType.includes("royalty");
  const isFreeLicense = licenseType.includes("free") || licenseType.includes("open") || licenseType.includes("creative");

  return (
    <div className={`asset-card view-${view}`}>
      <Card>
        <div className="cover">
          {waveform.length > 0 ? (
            <Waveform
              peaks={waveform}
              progress={isPlaying ? 1 : 0}
              playing={isPlaying}
            />
          ) : (
            <Music size={24} />
          )}
          {/* License badge */}
          <div className="badge" style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            padding: "1px 5px",
            borderRadius: "2px",
            fontSize: "8px",
            fontWeight: "600",
            backgroundColor: isFreeLicense ? "rgba(34, 197, 94, 0.15)" :
                           isPaidLicense ? "rgba(234, 88, 8, 0.15)" :
                           "rgba(16, 185, 129, 0.15)",
            color: isFreeLicense ? "#22c55e" :
                   isPaidLicense ? "#ea5808" :
                   "#10b981"
          }}>
            {isFreeLicense && "FREE"}
            {isPaidLicense && "PAID"}
            {!isFreeLicense && !isPaidLicense && "PREMIUM"}
          </div>
        </div>
        <div className="content">
          <CardContent>
            <div className="asset-meta">
              <div className="asset-author">By Unknown Artist</div>
              <div className="asset-details">
                {bpm && key && (
                  <>
                    <span>{bpm[0]}–{bpm[1]} BPM</span>
                    <span>· {key}</span>
                  </>
                )}
                {genres?.length > 0 && (
                  <span>{genres.slice(0, 2).join(", ")}{genres.length > 2 ? "…" : ""}</span>
                )}
              </div>
            </div>
            <div className="asset-footer">
              <div className="asset-price" style={{
                fontSize: "11px",
                fontWeight: "700",
                fontFamily: '"JetBrains Mono", monospace',
                color: isFree ? "#22c55e" :
                       isPaidLicense ? "#ea5808" :
                       "#eab308"
              }}>
                {isFree && "Free"}
                {!isFree && `$${formatEther(BigInt(price_snd))}`}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="asset-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePlay(asset)}
              >
                <Play size={16} /> {isPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssetDetail(asset)}
              >
                <FileText size={16} /> Details
              </Button>
            </div>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}