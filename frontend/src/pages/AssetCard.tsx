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
  const { name, bpm, key, genres, price_snd, license, waveform } = asset;

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
            <div className="asset-price">
              <Badge variant="secondary">{formatEther(BigInt(price_snd))} SND</Badge>
              <Badge variant="secondary">{license}</Badge>
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