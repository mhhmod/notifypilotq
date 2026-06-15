import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".agents/**",
      ".claude/**",
      ".cursor/**",
      ".gemini/**",
      ".impeccable/**",
      ".tmp/**",
      ".next/**",
      "node_modules/**",
      "public/shopify-push-client.js",
      "public/push-service-worker.js"
    ]
  },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;
