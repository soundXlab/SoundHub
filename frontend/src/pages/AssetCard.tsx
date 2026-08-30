import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge, Button } from "../components/ui";
import { Play, Music, FileText, ExternalLink, Loader, Settings2 } from "lucide-react";
import Waveform from "../components/Waveform";
import { formatEther } from "ethers";
import type { CatalogAsset } from "../types";
import { LICENSE_NAMES } from "../web3/contracts";
import { useTheme } from "../theme/themeContext";

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
  const { listing_id, name, bpm, key, genres, price_snd, license, waveform, duration_seconds } = asset;
  const { colors, spacing, radii, typography } = useTheme();

  // Styles for the asset card container
  const cardContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    padding: spacing.xl, // 16px
    // For grid vs list view, we can adjust the width or flex basis via parent container
    // The view prop is used by the parent (asset-grid or asset-list) to set layout
  };

  // Styles for the cover area (waveform or music icon)
  const coverStyle: React.CSSProperties = {
    // We'll keep the cover as a flex container to center the content
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Height can be fixed or based on tokens? We'll keep the same height as before (44px for waveform, but the icon is 24px)
    // We'll set a min-height to maintain layout
    minHeight: '44px',
  };

  // Styles for the asset meta container (inside CardDescription)
  const metaStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.md, // 8px
    marginBottom: spacing.sm, // 4px
  };

  // Styles for the asset details (BPM, key, genres)
  const detailsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs, // 2px
    fontSize: typography.fontSize.caption, // 11px
    color: colors.text.muted,
  };

  // Styles for the asset price and license badges container
  const priceStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm, // 4px
    flexWrap: 'wrap',
  };

  // Styles for the asset actions (buttons) container
  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing.sm, // 4px
    marginTop: spacing.md, // 8px
  };

  return (
    <div style={cardContainerStyle} className={`asset-card view-${view}`}>
      <Card>
        <div style={coverStyle}>
          {/* Cover image or waveform placeholder */}
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
        <CardContent>
          <CardTitle>{name}</CardTitle>
          <CardDescription>
            <div className="asset-meta" style={metaStyle}>
              <div className="asset-author">
                By Unknown Artist
              </div>
              <div className="asset-details" style={detailsStyle}>
                {bpm && key && (
                  <>
                    <span className="asset-bpm">{bpm[0]}–{bpm[1]} BPM</span>
                    <span className="asset-key">· {key}</span>
                  </>
                )}
                {genres?.length > 0 && (
                  <span className="asset-genres">{genres.slice(0, 2).join(", ")}{genres.length > 2 ? "…" : ""}</span>
                )}
              </div>
            </div>
            <div className="asset-price" style={priceStyle}>
              <Badge variant="secondary">{formatEther(BigInt(price_snd))} SND</Badge>
              <Badge variant="secondary">
                {license}
              </Badge>
            </div>
          </CardDescription>
        </CardContent>
        <CardFooter>
          <div className="asset-card-footer">
            <div className="asset-actions" style={actionsStyle}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePlay(asset)}
                className={isPlaying ? "playing" : ""}
              >
                {isPlaying ? (
                  <>
                    <Play size={16} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={16} /> Play
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssetDetail(asset)}
              >
                <FileText size={16} /> Details
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}