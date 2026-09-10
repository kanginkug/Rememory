import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        // 현재 운영 중인 AWS S3 버킷 (컷오버 전까지는 기존 이미지가 이 도메인에서 내려옴)
        protocol: 'https',
        hostname: 'rememory-images-493746472739-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com',
      },
      {
        // Oracle Object Storage 버킷 (컷오버 이후 신규/이관 이미지)
        protocol: 'https',
        hostname: 'nrwl044cs6nq.objectstorage.ap-tokyo-1.oraclecloud.com',
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/dapi\.kakao\.com\/.*/i,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^https:\/\/api\.rememory\.me\/.*/i,
        handler: "NetworkOnly",
      },
    ],
  },
})(nextConfig);
