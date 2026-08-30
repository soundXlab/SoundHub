import React from "react";
import { Folder, Music, Play, Loader } from "lucide-react";

interface EmptyStateProps {
  message: string;
  icon?: React.ComponentType<{ size?: number }>;
}

export default function EmptyState({ message, icon }: EmptyStateProps) {
  const Icon = icon || Music;
  return (
    <div className="empty-state">
      <Icon size={32} className="empty-state-icon" />
      <p className="empty-state-message">{message}</p>
    </div>
  );
}