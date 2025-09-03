import React from "react";

export function Input({ className = "", ...props }) {
  const cls = `w-full rounded-xl border border-gray-700 bg-black/20 text-white px-3 py-2 ${className}`;
  return <input className={cls} {...props} />;
}
