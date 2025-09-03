import React from "react";

export function Card({ className = "", children }) {
  return <div className={`bg-white/5 backdrop-blur border border-gray-700 rounded-2xl ${className}`}>{children}</div>;
}
export function CardHeader({ className = "", children, ...props }) {
  return <div className={`px-4 py-3 border-b border-gray-700 ${className}`} {...props}>{children}</div>;
}
export function CardTitle({ className = "", children }) {
  return <h3 className={`font-semibold ${className}`}>{children}</h3>;
}
export function CardDescription({ className = "", children }) {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
}
export function CardContent({ className = "", children }) {
  return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}
