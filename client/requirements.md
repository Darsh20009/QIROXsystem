## Packages
framer-motion | For smooth page transitions and glassmorphism animations
recharts | For dashboard analytics charts
date-fns | For date formatting
react-day-picker | For date selection in forms
lucide-react | For iconography

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["'Outfit'", "sans-serif"],
  body: ["'DM Sans'", "sans-serif"],
}
RTL Support:
The app uses `dir="rtl"` on the root. Ensure flex directions and margins start/end are handled correctly (e.g., `ml-auto` in LTR becomes `mr-auto` in RTL visually if not using logical properties, but Tailwind v3+ handles logical properties with `ms-` `me-` etc. We will stick to standard flex patterns and assume the browser flips layout for `dir="rtl"`).
