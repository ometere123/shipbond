import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background scale
        port: {
          black: "#06070A",
          panel: "#10131A",
          card: "#161B24",
          border: "#252B36",
          "border-bright": "#293241",
        },
        // Accent palette
        amber: {
          bond: "#FFB000",
          partial: "#FFCA3A",
        },
        cyan: {
          evidence: "#00E5FF",
        },
        violet: {
          consensus: "#7C5CFF",
        },
        lime: {
          passed: "#B6FF3B",
        },
        red: {
          failed: "#FF4D2E",
        },
        // Text
        fog: "#B8C0CC",
        steel: "#6F7A8A",
        signal: "#F8FAFC",
      },
      fontFamily: {
        display: ["var(--font-unbounded)", "sans-serif"],
        body: ["var(--font-sora)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        hero: ["72px", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        "page-title": ["42px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "section-title": ["28px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "panel-title": ["20px", { lineHeight: "1.3" }],
        "card-title": ["18px", { lineHeight: "1.3" }],
        base: ["16px", { lineHeight: "1.6" }],
        table: ["14px", { lineHeight: "1.5" }],
        meta: ["12px", { lineHeight: "1.4" }],
        badge: ["11px", { lineHeight: "1.3", letterSpacing: "0.06em" }],
      },
      borderRadius: {
        btn: "8px",
        card: "18px",
        panel: "22px",
        modal: "24px",
        input: "12px",
      },
      boxShadow: {
        "amber-glow": "0 0 24px 0 rgba(255, 176, 0, 0.18)",
        "cyan-glow": "0 0 24px 0 rgba(0, 229, 255, 0.18)",
        "violet-glow": "0 0 24px 0 rgba(124, 92, 255, 0.18)",
        "lime-glow": "0 0 24px 0 rgba(182, 255, 59, 0.18)",
        "card-lift": "0 4px 32px 0 rgba(0,0,0,0.48)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "stamp-in": "stampIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "scan-line": "scanLine 4s linear infinite",
      },
      keyframes: {
        stampIn: {
          "0%": { transform: "scale(1.4) rotate(-6deg)", opacity: "0" },
          "100%": { transform: "scale(1) rotate(-3deg)", opacity: "1" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      backgroundImage: {
        "port-grid":
          "linear-gradient(rgba(37,43,54,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(37,43,54,0.4) 1px, transparent 1px)",
        "amber-radial":
          "radial-gradient(ellipse at 50% 0%, rgba(255,176,0,0.12) 0%, transparent 60%)",
        "violet-radial":
          "radial-gradient(ellipse at 50% 50%, rgba(124,92,255,0.10) 0%, transparent 70%)",
      },
      backgroundSize: {
        grid: "48px 48px",
      },
    },
  },
  plugins: [],
};

export default config;
