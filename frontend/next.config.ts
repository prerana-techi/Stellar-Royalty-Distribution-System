import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
      'sodium-native': 'commonjs sodium-native',
      'require-addon': 'commonjs require-addon',
    });
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /node_modules\/(require-addon|sodium-native)/ },
    ];
    return config;
  },
};

export default nextConfig;
