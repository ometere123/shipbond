import type { Metadata } from "next";
import { Unbounded, Sora, JetBrains_Mono } from "next/font/google";
import { Web3Provider } from "@/providers/Web3Provider";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "ShipBond — Bond the Work. Ship the Proof. Let GenLayer Judge.",
    template: "%s | ShipBond",
  },
  description:
    "ShipBond is a GenLayer-native milestone bond protocol. Sponsors fund builder tasks, builders lock delivery bonds, and GenLayer reviews evidence to decide whether the work was actually completed.",
  keywords: ["GenLayer", "milestone", "bond", "builder", "proof", "delivery", "blockchain"],
  openGraph: {
    title: "ShipBond",
    description: "Bond the Work. Ship the Proof. Let GenLayer Judge.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShipBond",
    description: "Bond the Work. Ship the Proof. Let GenLayer Judge.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${unbounded.variable} ${sora.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-port-black text-signal antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
