import React from "react";

const base = "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm border focus:outline-none focus:ring disabled:opacity-50";
const variants = {
  default: "bg-black text-white border-black hover:opacity-90",
  secondary: "bg-white text-black border-gray-300 hover:bg-gray-50",
  outline: "bg-transparent text-white border-gray-600 hover:bg-gray-800",
};
const sizes = {
  sm: "px-2.5 py-1.5 text-sm",
  xs: "px-2 py-1 text-xs",
  md: "",
};

export function Button({ children, className = "", variant = "default", size = "md", ...props }) {
  const cls = [base, variants[variant] ?? variants.default, sizes[size] ?? "", className].join(" ");
  return <button className={cls} {...props}>{children}</button>;
}
export default Button;
