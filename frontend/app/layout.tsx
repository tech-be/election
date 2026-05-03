import "./globals.css";
import { Noto_Serif_JP, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${notoSerif.variable} min-h-screen bg-slate-950 text-slate-50`}>
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-400">
            Copyrights BE-Tech 2026
          </footer>
        </div>
      </body>
    </html>
  );
}

