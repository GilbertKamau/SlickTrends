import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // @ts-ignore - disabling the dev toolbar/N icon
    appIsrStatus: false,
  } as any,
};

export default nextConfig;
