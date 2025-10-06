/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Allow Wix editor + wixsite previews to embed your app
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors https://editor.wix.com https://*.wixsite.com 'self';",
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
