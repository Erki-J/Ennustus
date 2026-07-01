import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/groups/:groupId/predictions",
        destination: "/groups/:groupId/prediction-centre",
        permanent: true,
      },
      {
        source: "/groups/:groupId/standings",
        destination: "/groups/:groupId/overview",
        permanent: true,
      },
      {
        source: "/groups/:groupId/settings",
        destination: "/groups/:groupId/settings/scoring",
        permanent: true,
      },
      {
        source: "/groups/:groupId/admin/matches",
        destination: "/groups/:groupId/matches",
        permanent: true,
      },
      {
        source: "/groups/:groupId/settings/matches",
        destination: "/groups/:groupId/matches",
        permanent: true,
      },
      {
        source: "/groups/:groupId/settings/matches/:roundKey",
        destination: "/groups/:groupId/matches/:roundKey",
        permanent: true,
      },
      {
        source: "/groups/:groupId/leaderboard/bonus",
        destination: "/groups/:groupId/overview/bonus",
        permanent: true,
      },
      {
        source: "/groups/:groupId/leaderboard/:roundKey",
        destination: "/groups/:groupId/overview/:roundKey",
        permanent: true,
      },
      {
        source: "/groups/:groupId/leaderboard",
        destination: "/groups/:groupId/overview",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
