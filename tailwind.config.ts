import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        card: "oklch(var(--card) / <alpha-value>)",
        muted: "oklch(var(--muted) / <alpha-value>)",
        "muted-foreground": "oklch(var(--muted-foreground) / <alpha-value>)",
        border: "oklch(var(--border) / <alpha-value>)",
        sidebar: "oklch(var(--sidebar) / <alpha-value>)",
        "sidebar-muted": "oklch(var(--sidebar-muted) / <alpha-value>)",
        "sidebar-foreground": "oklch(var(--sidebar-foreground) / <alpha-value>)",
        accent: "oklch(var(--accent) / <alpha-value>)",
        "accent-foreground": "oklch(var(--accent-foreground) / <alpha-value>)",
        success: "oklch(var(--success) / <alpha-value>)",
        warning: "oklch(var(--warning) / <alpha-value>)",
        danger: "oklch(var(--danger) / <alpha-value>)"
      },
      borderRadius: {
        sm: "0.5rem",
        DEFAULT: "0.625rem",
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1rem",
        "2xl": "1.25rem"
      },
      boxShadow: {
        card: "0 1px 2px oklch(0.214 0.004 84.6 / 0.04), 0 12px 32px oklch(0.214 0.004 84.6 / 0.05)"
      }
    }
  },
  plugins: []
};

export default config;
