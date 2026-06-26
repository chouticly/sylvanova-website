import createNextJsObfuscator from "nextjs-obfuscator";
import type { NextConfig } from "next";

const withObfuscator = createNextJsObfuscator(
  {
    compact: true,
    disableConsoleOutput: false,
    identifierNamesGenerator: "hexadecimal",
    simplify: true,
    stringArray: true,
    stringArrayRotate: true,
  },
  {
    enabled: "detect",
    log: false,
  }
);

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["discord.js", "@discordjs/ws", "zlib-sync"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
};

export default withObfuscator(nextConfig);
