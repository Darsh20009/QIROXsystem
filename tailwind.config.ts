import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem", /* 9px */
        md: ".375rem", /* 6px */
        sm: ".1875rem", /* 3px */
      },
      colors: {
        // Flat / base colors (regular buttons)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          foreground: "hsl(var(--brand-foreground) / <alpha-value>)",
          muted: "hsl(var(--brand-muted) / <alpha-value>)",
          dark: "hsl(var(--brand-dark) / <alpha-value>)",
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },

        // ── QIROX Design System V2 — token foundation only ──────────────────
        // Additive namespace ("ds" = Design System v2). Not used by any
        // existing page/component yet; safe to extend without affecting the
        // current `brand`/shadcn tokens above. See docs/design-system-v2.md.
        ds: {
          white: "hsl(var(--ds-white) / <alpha-value>)",
          "off-white": "hsl(var(--ds-off-white) / <alpha-value>)",
          black: "hsl(var(--ds-black) / <alpha-value>)",
          navy: {
            50: "hsl(var(--ds-navy-50) / <alpha-value>)",
            100: "hsl(var(--ds-navy-100) / <alpha-value>)",
            200: "hsl(var(--ds-navy-200) / <alpha-value>)",
            300: "hsl(var(--ds-navy-300) / <alpha-value>)",
            400: "hsl(var(--ds-navy-400) / <alpha-value>)",
            500: "hsl(var(--ds-navy-500) / <alpha-value>)",
            600: "hsl(var(--ds-navy-600) / <alpha-value>)",
            700: "hsl(var(--ds-navy-700) / <alpha-value>)",
            800: "hsl(var(--ds-navy-800) / <alpha-value>)",
            900: "hsl(var(--ds-navy-900) / <alpha-value>)",
            950: "hsl(var(--ds-navy-950) / <alpha-value>)",
          },
          blue: {
            50: "hsl(var(--ds-blue-50) / <alpha-value>)",
            100: "hsl(var(--ds-blue-100) / <alpha-value>)",
            200: "hsl(var(--ds-blue-200) / <alpha-value>)",
            300: "hsl(var(--ds-blue-300) / <alpha-value>)",
            400: "hsl(var(--ds-blue-400) / <alpha-value>)",
            500: "hsl(var(--ds-blue-500) / <alpha-value>)",
            600: "hsl(var(--ds-blue-600) / <alpha-value>)",
            700: "hsl(var(--ds-blue-700) / <alpha-value>)",
            800: "hsl(var(--ds-blue-800) / <alpha-value>)",
            900: "hsl(var(--ds-blue-900) / <alpha-value>)",
            950: "hsl(var(--ds-blue-950) / <alpha-value>)",
          },
          gray: {
            50: "hsl(var(--ds-gray-50) / <alpha-value>)",
            100: "hsl(var(--ds-gray-100) / <alpha-value>)",
            200: "hsl(var(--ds-gray-200) / <alpha-value>)",
            300: "hsl(var(--ds-gray-300) / <alpha-value>)",
            400: "hsl(var(--ds-gray-400) / <alpha-value>)",
            500: "hsl(var(--ds-gray-500) / <alpha-value>)",
            600: "hsl(var(--ds-gray-600) / <alpha-value>)",
            700: "hsl(var(--ds-gray-700) / <alpha-value>)",
            800: "hsl(var(--ds-gray-800) / <alpha-value>)",
            900: "hsl(var(--ds-gray-900) / <alpha-value>)",
            950: "hsl(var(--ds-gray-950) / <alpha-value>)",
          },
          green: {
            500: "hsl(var(--ds-green-500) / <alpha-value>)",
            600: "hsl(var(--ds-green-600) / <alpha-value>)",
            foreground: "hsl(var(--ds-green-foreground) / <alpha-value>)",
          },
          "purple-restricted": "hsl(var(--ds-purple-restricted) / <alpha-value>)",

          background: "hsl(var(--ds-background) / <alpha-value>)",
          foreground: "hsl(var(--ds-foreground) / <alpha-value>)",
          "surface-0": "hsl(var(--ds-surface-0) / <alpha-value>)",
          "surface-1": "hsl(var(--ds-surface-1) / <alpha-value>)",
          "surface-2": "hsl(var(--ds-surface-2) / <alpha-value>)",
          "surface-inverse": "hsl(var(--ds-surface-inverse) / <alpha-value>)",
          "surface-inverse-foreground": "hsl(var(--ds-surface-inverse-foreground) / <alpha-value>)",
          primary: "hsl(var(--ds-primary) / <alpha-value>)",
          "primary-foreground": "hsl(var(--ds-primary-foreground) / <alpha-value>)",
          secondary: "hsl(var(--ds-secondary) / <alpha-value>)",
          "secondary-foreground": "hsl(var(--ds-secondary-foreground) / <alpha-value>)",
          muted: "hsl(var(--ds-muted) / <alpha-value>)",
          "muted-foreground": "hsl(var(--ds-muted-foreground) / <alpha-value>)",
          accent: "hsl(var(--ds-accent) / <alpha-value>)",
          "accent-foreground": "hsl(var(--ds-accent-foreground) / <alpha-value>)",
          "border-hairline": "hsl(var(--ds-border-hairline) / <alpha-value>)",
          "border-emphasis": "hsl(var(--ds-border-emphasis) / <alpha-value>)",
          "focus-ring": "hsl(var(--ds-focus-ring) / <alpha-value>)",
        },
      },
      fontSize: {
        "ds-xs": "var(--ds-text-xs)",
        "ds-sm": "var(--ds-text-sm)",
        "ds-base": "var(--ds-text-base)",
        "ds-lg": "var(--ds-text-lg)",
        "ds-xl": "var(--ds-text-xl)",
        "ds-2xl": "var(--ds-text-2xl)",
        "ds-3xl": "var(--ds-text-3xl)",
        "ds-4xl": "var(--ds-text-4xl)",
        "ds-5xl": "var(--ds-text-5xl)",
        "ds-6xl": "var(--ds-text-6xl)",
      },
      borderRadius: {
        "ds-xs": "var(--ds-radius-xs)",
        "ds-sm": "var(--ds-radius-sm)",
        "ds-md": "var(--ds-radius-md)",
        "ds-lg": "var(--ds-radius-lg)",
        "ds-xl": "var(--ds-radius-xl)",
        "ds-2xl": "var(--ds-radius-2xl)",
        "ds-full": "var(--ds-radius-full)",
      },
      boxShadow: {
        "ds-xs": "var(--ds-shadow-xs)",
        "ds-sm": "var(--ds-shadow-sm)",
        "ds-md": "var(--ds-shadow-md)",
        "ds-lg": "var(--ds-shadow-lg)",
        "ds-xl": "var(--ds-shadow-xl)",
        "ds-glass": "var(--ds-shadow-glass)",
      },
      zIndex: {
        "ds-base": "var(--ds-z-base)",
        "ds-dropdown": "var(--ds-z-dropdown)",
        "ds-sticky": "var(--ds-z-sticky)",
        "ds-overlay": "var(--ds-z-overlay)",
        "ds-modal": "var(--ds-z-modal)",
        "ds-toast": "var(--ds-z-toast)",
        "ds-max": "var(--ds-z-max)",
      },
      maxWidth: {
        "ds-container-sm": "var(--ds-container-sm)",
        "ds-container-md": "var(--ds-container-md)",
        "ds-container-lg": "var(--ds-container-lg)",
        "ds-container-xl": "var(--ds-container-xl)",
      },
      transitionDuration: {
        "ds-fast": "150ms",
        "ds-base": "280ms",
        "ds-slow": "480ms",
        "ds-slower": "800ms",
      },
      transitionTimingFunction: {
        "ds-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ds-emphasized": "cubic-bezier(0.2, 0.8, 0.2, 1)",
        "ds-decel": "cubic-bezier(0, 0, 0.2, 1)",
        "ds-accel": "cubic-bezier(0.4, 0, 1, 1)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        sans: ["var(--font-body)", "sans-serif"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        equalizer: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        equalizer: "equalizer 0.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
