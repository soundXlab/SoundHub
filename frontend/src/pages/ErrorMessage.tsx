import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="error-message">
      <AlertTriangle size={20} className="error-icon" />
      <p className="error-text">{message}</p>
    </div>
  );
}