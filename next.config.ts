import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental:{
    typedEnv:true,
  },
  images:{
    remotePatterns:[
      {
        protocol:"https",
        hostname:"raw.githubusercontent.com",
        pathname:"/adityarwt1/Question-Counter/**",
      },
      {
        protocol:"https",
        hostname:"chatgpt.com",
        pathname:"/backend-api/**"
      }
    ]
  }
};

export default nextConfig;
