import { createRequire } from "module";
const require = createRequire(import.meta.url);
const data = require("./package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  publicRuntimeConfig: {
    appVersion: data.version,
  },
  assetPrefix: process.env?.URL_PREFIX,
  basePath: process.env?.URL_PREFIX,
  distDir: "build",
  output: "export",
};

export default nextConfig;
