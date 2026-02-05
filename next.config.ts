import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 排除扫描的目录
  serverExternalPackages: ['fs'],
  // 使用 webpack 而不是 Turbopack（因为路径包含中文字符）
  // Turbopack 在处理包含非 ASCII 字符的路径时会有问题
};

export default nextConfig;
