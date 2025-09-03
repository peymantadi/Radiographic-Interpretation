export const metadata = {
  title: "Radiographic Interpretation Note Builder",
  description: "Click items to populate your daily radiographic interpretation note.",
};

import "../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
