import React from "react";

interface MarketplaceSortProps {
  activeSort: string;
  onSortChange: (sort: string) => void;
  totalResults: number;
}

export const MarketplaceSort: React.FC<MarketplaceSortProps> = ({
  activeSort,
  onSortChange,
  totalResults,
}) => {
  return (
    <div className="sort-row">
      <span>{totalResults} results</span>
      <div style={{ display: "flex", gap: "6px" }}>
        <div
          className={`sort-btn ${activeSort === "Popular" ? "active" : ""}`}
          onClick={() => onSortChange("Popular")}
        >
          Popular
        </div>
        <div
          className={`sort-btn ${activeSort === "New" ? "active" : ""}`}
          onClick={() => onSortChange("New")}
        >
          New
        </div>
        <div
          className={`sort-btn ${activeSort === "Price ↑" ? "active" : ""}`}
          onClick={() => onSortChange("Price ↑")}
        >
          Price ↑
        </div>
        <div
          className={`sort-btn ${activeSort === "Rating" ? "active" : ""}`}
          onClick={() => onSortChange("Rating")}
        >
          Rating
        </div>
      </div>
    </div>
  );
};