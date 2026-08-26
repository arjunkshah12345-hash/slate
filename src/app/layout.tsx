import type { Metadata } from "next";
import { IBM_Plex_Mono, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plex = IBM_Plex_Mono({
  variable: "--font-tc",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Slate. Cut it with the agent in the room.",
  description:
    "A directing studio where ChatGPT and you share one playhead, one pin, and one clap. Built for the WebMCP Challenge.",
  metadataBase: new URL("https://slate-webmcp.vercel.app"),
  openGraph: {
    title: "Slate",
    description: "Cut it with the agent in the room.",
    url: "https://slate-webmcp.vercel.app",
    siteName: "Slate",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${plex.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-ui)]">{children}</body>
    </html>
  );
}
