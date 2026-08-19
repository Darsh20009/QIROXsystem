import { createRequire } from "module";
const _req = createRequire(import.meta.url);
let hasBaseline = false;
try { _req.resolve("baseline-browser-mapping"); hasBaseline = true; } catch {}

export default {
  plugins: {
    tailwindcss: {},
    ...(hasBaseline ? { autoprefixer: {} } : {}),
  },
};
