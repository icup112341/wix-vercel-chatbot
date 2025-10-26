const DEFAULT_FRAME_ANCESTORS = [
  "'self'",
  "https://editor.wix.com",
  "https://www.wix.com",
  "https://*.wixsite.com",
  "https://*.editorx.io"
];

function getFrameAncestors() {
  const extra = process.env.ALLOWED_FRAME_ANCESTORS?.split(/[,\s]+/)
    .map(origin => origin.trim())
    .filter(Boolean);

  const merged = new Set(DEFAULT_FRAME_ANCESTORS);
  if (extra) {
    for (const origin of extra) merged.add(origin);
  }

  return Array.from(merged).join(" ");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${getFrameAncestors()};`
          },
          {
            key: "X-Frame-Options",
            value: "ALLOWALL"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
