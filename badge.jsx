import React from "react";

export function Badge({ className = "", variant = "default", children }) {
  const styles = variant === "default"
    ? "bg-blue-600/20 text-blue-300 border-blue-600/40"
    : "bg-gray-600/20 text-gray-300 border-gray-500/40";
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full border ${styles} ${className}`}>{children}</span>;
}
