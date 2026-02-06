import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      radii: {
        card: { value: "22px" },
        shell: { value: "28px" },
      },
      shadows: {
        premium: { value: "0 30px 90px rgba(0,0,0,0.55)" },
      },
    },

    semanticTokens: {
      colors: {
        // ----- backgrounds -----
        "bg.canvas": { value: { base: "#F7FAFC", _dark: "#050816" } },
        "bg.panel": { value: { base: "#FFFFFF", _dark: "rgba(11, 18, 39, 0.72)" } },
        "bg.elevated": { value: { base: "#FFFFFF", _dark: "rgba(14, 25, 55, 0.70)" } },
        "bg.muted": { value: { base: "rgba(15,23,42,0.04)", _dark: "rgba(234,240,255,0.06)" } },

        // ----- text -----
        fg: { value: { base: "#0B1227", _dark: "#EAF0FF" } },
        "fg.muted": { value: { base: "rgba(11,18,39,0.72)", _dark: "rgba(234,240,255,0.72)" } },
        "fg.subtle": { value: { base: "rgba(11,18,39,0.55)", _dark: "rgba(234,240,255,0.55)" } },
        "fg.error": { value: { base: "#DC2626", _dark: "#FB7185" } },

        // ----- borders -----
        "border.default": { value: { base: "rgba(15,23,42,0.12)", _dark: "rgba(148,163,184,0.18)" } },
        "border.subtle": { value: { base: "rgba(15,23,42,0.08)", _dark: "rgba(148,163,184,0.14)" } },
        "border.strong": { value: { base: "rgba(15,23,42,0.18)", _dark: "rgba(148,163,184,0.28)" } },
        "border.muted": { value: { base: "rgba(15,23,42,0.10)", _dark: "rgba(148,163,184,0.16)" } },

        // ----- accents -----
        "accent.primary": { value: { base: "#4F46E5", _dark: "#7C3AED" } },
        "accent.secondary": { value: { base: "#0891B2", _dark: "#22D3EE" } },

        success: { value: { base: "#16A34A", _dark: "#34D399" } },
        warn: { value: { base: "#D97706", _dark: "#FBBF24" } },
        danger: { value: { base: "#DC2626", _dark: "#FB7185" } },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
