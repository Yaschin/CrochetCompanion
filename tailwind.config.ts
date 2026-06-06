import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      fontFamily: {
        // Body: warm, rounded humanist sans
        sans: ['"Nunito Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        // Display/headings: characterful soft serif — handcrafted, premium
        heading: ['"Fraunces"', 'ui-serif', 'Georgia', 'Cambria', 'serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // ---- Semantic tokens (driven by CSS vars in index.css) ----
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        // ---- Brand scales (explicit so numeric utilities resolve) ----
        // Primary: "rose madder" — the vivid, wool-dyed hero accent
        primary: {
          DEFAULT: "#C24E6B",
          foreground: "#FFFFFF",
          50: "#FBF1F4",
          100: "#F6E1E8",
          200: "#ECC2CF",
          300: "#DF9DB1",
          400: "#D17791",
          500: "#C24E6B",
          600: "#A93C58",
          700: "#8C2F47",
          800: "#70283A",
          900: "#5C2330",
          dark: "#8C2F47",
        },
        // Secondary: "sage" — natural-dye companion, used for headings/structure
        secondary: {
          DEFAULT: "#84934F",
          foreground: "#FFFFFF",
          50: "#F5F7EF",
          100: "#E9EEDB",
          200: "#D4DEB9",
          300: "#BBC990",
          400: "#A0B06B",
          500: "#84934F",
          600: "#69763D",
          700: "#515B30",
          800: "#404829",
          900: "#363C23",
        },
        // Honey: warm marigold for highlights & celebratory moments
        honey: {
          DEFAULT: "#DE9F2E",
          50: "#FDF7E9",
          100: "#FAEAC4",
          200: "#F4D488",
          300: "#ECBC50",
          400: "#E2A52F",
          500: "#DE9F2E",
          600: "#BC8222",
          700: "#94661C",
        },
        // Warm neutral "wool" greys (override cool default greys)
        gray: {
          50: "#FAF8F4",
          100: "#F2EEE7",
          200: "#E6DFD3",
          300: "#D4C9B8",
          400: "#B3A491",
          500: "#8E7E6A",
          600: "#6E6052",
          700: "#524739",
          800: "#392F26",
          900: "#241E18",
        },
      },
      backgroundImage: {
        // Very subtle linen weave — applied to the app background
        'linen': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%23000000' fill-opacity='0.018'%3E%3Cpath d='M0 0h20v20H0zM20 20h20v20H20z'/%3E%3C/g%3E%3C/svg%3E\")",
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
        // Signature "running stitch" — draws a dashed thread along a path
        "stitch-draw": {
          from: { "stroke-dashoffset": "var(--stitch-length, 200)" },
          to: { "stroke-dashoffset": "0" },
        },
        // Gentle bob for the yarn-ball mark
        "yarn-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "stitch-draw": "stitch-draw 1.1s ease-in-out forwards",
        "yarn-float": "yarn-float 3.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
