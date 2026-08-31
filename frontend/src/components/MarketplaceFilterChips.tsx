import React from "react";

interface MarketplaceFilterChipsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  filters: string[];
}

export const MarketplaceFilterChips: React.FC<MarketplaceFilterChipsProps> = ({
  activeFilter,
  onFilterChange,
  filters,
}) => {
  return (
    <div className="filter-row">
      {filters.map((filter) => (
        <div
          key={filter}
          className={`filter-chip ${activeFilter === filter ? "active" : ""}`}
          onClick={() => onFilterChange(filter)}
        >
          {filter}
        </div>
      ))}
    </div>
  );
};