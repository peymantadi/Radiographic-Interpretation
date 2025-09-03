import React from "react";

export function Label({ className = "", children, ...props }) {
  return <label className={`text-xs text-muted-foreground ${className}`} {...props}>{children}</label>;
}
