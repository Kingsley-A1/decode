import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("@playwright/test");
const chromeLauncher = require("chrome-launcher");
const { createJiti } = require("jiti");

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PUBLIC_RENDERER_LIGHTHOUSE_PORT ?? 4317);
const threshold = Number(process.env.PUBLIC_RENDERER_LIGHTHOUSE_A11Y ?? 95);
const contentTypes = new Map([
  [".webp", "image/webp"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
]);

const jiti = createJiti(`${root}/`);
const { renderLandingPageHtml } = jiti("./server/landing-pages/render.ts");
const { LANDING_PAGE_TYPE } = jiti("./server/landing-pages/constants.ts");

const html = renderLandingPageHtml({
  title: "School Admissions",
  type: LANDING_PAGE_TYPE.BUSINESS,
  content: {
    businessName: "School Admissions",
    tagline: "Applications, visits, and parent information",
    description:
      "Share admissions details, open day information, school contacts, and application links in one mobile-friendly page.",
    website: "https://example.edu/admissions",
    phone: "+1 555 0100",
    email: "admissions@example.edu",
    heroAssetPath:
      "/assets/landing-page-templates/school/school-campus-exterior.webp",
    heroAlt: "Students walking through a bright school campus entrance",
    heroWidth: 1600,
    heroHeight: 900,
    links: [{ label: "Apply online", url: "https://example.edu/apply" }],
  },
});

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);

  if (url.pathname === "/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(html);
    return;
  }

  if (url.pathname.startsWith("/assets/")) {
    const relativePath = normalize(url.pathname.replace(/^\//, ""));
    const publicRoot = join(root, "public");
    const absolutePath = join(publicRoot, relativePath);

    if (absolutePath.startsWith(publicRoot) && existsSync(absolutePath)) {
      response.writeHead(200, {
        "content-type":
          contentTypes.get(extname(absolutePath)) ?? "application/octet-stream",
      });
      createReadStream(absolutePath).pipe(response);
      return;
    }
  }

  response.writeHead(404, { "content-type": "text/plain" });
  response.end("Not found");
});

let chrome;

try {
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));

  const { default: lighthouse } = await import("lighthouse");
  chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  const result = await lighthouse(`http://127.0.0.1:${port}`, {
    port: chrome.port,
    output: "json",
    logLevel: "error",
    onlyCategories: ["accessibility"],
  });
  const score = Math.round(
    (result?.lhr.categories.accessibility.score ?? 0) * 100
  );

  console.log(`public-renderer accessibility=${score}`);

  if (score < threshold) {
    process.exitCode = 1;
  }
} finally {
  if (chrome) {
    try {
      await chrome.kill();
    } catch {
      // Chrome can already be gone on Windows after Lighthouse completes.
    }
  }

  await new Promise((resolve) => server.close(resolve));
}
