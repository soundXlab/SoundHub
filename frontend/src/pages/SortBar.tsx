import React from "react";
import { Button } from "../components/ui";

interface SortBarProps {
  sortBy: string;
  onSortChange: (value: string) => void;
}

export default function SortBar({ sortBy, onSortChange }: SortBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value);
  };

  return (
    <div className="sort-bar">
      <label htmlFor="sort">Sort by:</label>
      <select id="sort" value={sortBy} onChange={handleChange}>
        <option value="relevant">Relevant</option>
        <option value="newest">Newest</option>
        <option value="popular">Popular</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
      </select>
    </div>
  );
}