import React from "react";

export function Textarea({ className = "", ...props }) {
  const cls = `w-full min-h-[90px] rounded-xl border border-gray-700 bg-black/20 text-white px-3 py-2 font-mono text-sm ${className}`;
  return <textarea className={cls} {...props} />;
}
