import React from "react";
import { Button, Input } from "../components/ui";

interface ToolbarProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSellAsset: () => void;
  onMyLibrary: () => void;
}

export default function Toolbar({
  searchQuery,
  onSearchChange,
  onSellAsset,
  onMyLibrary,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <h1>SoundHub Marketplace</h1>
      <div className="toolbar-actions">
        <Input
          placeholder="Search assets..."
          value={searchQuery}
          onChange={onSearchChange}
          className="search-input"
        />
        <div className="toolbar-buttons">
          <Button variant="ghost" size="sm" onClick={onSellAsset}>
            Sell asset
          </Button>
          <Button variant="ghost" size="sm" onClick={onMyLibrary}>
            My library
          </Button>
        </div>
      </div>
    </div>
  );
}