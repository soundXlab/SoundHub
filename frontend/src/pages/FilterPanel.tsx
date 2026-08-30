import React from "react";
import { Button, Input } from "../components/ui";
import { LICENSE_NAMES } from "../web3/contracts";
import { Filters } from "./MarketplacePage";

interface FilterPanelProps {
  filters: Filters;
  genreOptions: string[];
  keyOptions: string[];
  licenseOptions: string[];
  formatOptions: string[];
  pluginOptions: string[];
  onFilterChange: (key: keyof Filters, value: string) => void;
  onResetFilters: () => void;
}

export default function FilterPanel({
  filters,
  genreOptions,
  keyOptions,
  licenseOptions,
  formatOptions,
  pluginOptions,
  onFilterChange,
  onResetFilters,
}: FilterPanelProps) {
  const handleChange = (key: keyof Filters, value: string) => {
    onFilterChange(key, value);
  };

  return (
    <div className="filter-panel">
      <h3>Filters</h3>
      <div className="filter-group">
        <label>Search:</label>
        <Input
          value={filters.q}
          onChange={(e) => handleChange("q", e.target.value)}
          placeholder="Search..."
        />
      </div>
      <div className="filter-group">
        <label>Genre:</label>
        <select
          value={filters.genre}
          onChange={(e) => handleChange("genre", e.target.value)}
        >
          <option value="">All</option>
          {genreOptions.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Key:</label>
        <select
          value={filters.key}
          onChange={(e) => handleChange("key", e.target.value)}
        >
          <option value="">All</option>
          {keyOptions.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>License:</label>
        <select
          value={filters.license}
          onChange={(e) => handleChange("license", e.target.value)}
        >
          <option value="">All</option>
          {licenseOptions.map((license) => (
            <option key={license} value={license}>
              {license}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Format:</label>
        <select
          value={filters.format}
          onChange={(e) => handleChange("format", e.target.value)}
        >
          <option value="">All</option>
          {formatOptions.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>Plugin:</label>
        <select
          value={filters.plugin}
          onChange={(e) => handleChange("plugin", e.target.value)}
        >
          <option value="">All</option>
          {pluginOptions.map((plugin) => (
            <option key={plugin} value={plugin}>
              {plugin}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-group">
        <label>BPM Range:</label>
        <div className="bpm-range">
          <Input
            type="number"
            value={filters.bpmMin}
            onChange={(e) => handleChange("bpmMin", e.target.value)}
            placeholder="Min"
          />
          <span>to</span>
          <Input
            type="number"
            value={filters.bpmMax}
            onChange={(e) => handleChange("bpmMax", e.target.value)}
            placeholder="Max"
          />
        </div>
      </div>
      <div className="filter-actions">
        <Button variant="outline" size="sm" onClick={onResetFilters}>
          Clear all
        </Button>
      </div>
    </div>
  );
}