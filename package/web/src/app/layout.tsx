import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";


export const metadata: Metadata = {
  title: "白雪巴ファンサイト - Diopside",
  description: "白雪巴さんの過去アーカイブを楽しく閲覧できるファンサイト",
  keywords: ["白雪巴", "vtuber", "アーカイブ", "ファンサイト"],
  authors: [{ name: "Diopside Team" }],
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#6E3FE7',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
