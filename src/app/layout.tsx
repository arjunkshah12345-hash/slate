import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { WebmcpBridge } from "@/components/webmcp-bridge";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slate",
  description: "Cut with the agent.",
  metadataBase: new URL("https://slate-webmcp.vercel.app"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preload" as="image" href="/plates/plate-laugh.webp" fetchPriority="high" />
      </head>
      <body className={`${GeistSans.className} min-h-full`}>
        <WebmcpBridge />
        {children}
      </body>
    </html>
  );
}
