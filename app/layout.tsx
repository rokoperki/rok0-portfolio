import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NERV // MONITORING TERMINAL",
  description: "Portfolio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&family=VT323&family=Pixelify+Sans:wght@400;500;600;700&family=DotGothic16&family=Noto+Sans+JP:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body data-mview="main">{children}</body>
    </html>
  );
}
