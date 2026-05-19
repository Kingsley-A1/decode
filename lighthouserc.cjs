const port = Number(process.env.LHCI_PORT ?? 3101);
const baseUrl = `http://127.0.0.1:${port}`;

module.exports = {
  ci: {
    collect: {
      url: [`${baseUrl}/`, `${baseUrl}/documentation`, `${baseUrl}/about`],
      startServerCommand: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
      startServerReadyPattern: "Ready",
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.05 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
