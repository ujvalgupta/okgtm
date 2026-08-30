import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next 16 flat config (eslint-config-next v16 ships flat configs natively —
// the legacy FlatCompat shim is gone in favor of direct imports).
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "convex/**"] },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
