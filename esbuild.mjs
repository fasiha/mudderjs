import { build } from "esbuild";
import commonjsPlugin from "@chialab/esbuild-plugin-commonjs";

// Build IIFE
await build({
  entryPoints: ["index.js"],
  outfile: "dist/mudder.min.js",
  sourcemap: true,
  minify: true,
  format: "iife",
});

// Build Node commonjs
await build({
  entryPoints: ["index.js"],
  outfile: "dist/mudder.cjs",
  format: "cjs",
});

// Build ESM module
await build({
  plugins: [commonjsPlugin()],
  entryPoints: ["index.js"],
  outfile: "dist/mudder.min.mjs",
  bundle: true,
  sourcemap: true,
  minify: true,
  format: "esm",
  target: ["es2021"],
});
