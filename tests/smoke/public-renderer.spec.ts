import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { LANDING_PAGE_TYPE } from "../../server/landing-pages/constants";
import { renderLandingPageHtml } from "../../server/landing-pages/render";

test.describe("public landing page renderer", () => {
  test("renders an accessible no-JS public page with media", async ({ page }) => {
    const html = renderLandingPageHtml({
      title: "School Admissions",
      type: LANDING_PAGE_TYPE.BUSINESS,
      content: {
        businessName: "School Admissions",
        tagline: "Applications, visits, and parent information",
        description:
          "Share admissions details, open day information, contacts, and application links in one mobile-friendly page.",
        website: "https://example.edu/admissions",
        phone: "+1 555 0100",
        email: "admissions@example.edu",
        heroAssetId: "campus_hero",
        heroAlt: "Students walking through a bright school campus entrance",
        links: [{ label: "Apply online", url: "https://example.edu/apply" }],
      },
    });

    await page.setContent(html, { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", { name: "School Admissions", level: 1 })
    ).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: "Students walking through a bright school campus entrance",
      })
    ).toBeVisible();
    await expect(page.locator("script")).toHaveCount(0);

    const results = await new AxeBuilder({ page }).analyze();
    const severeViolations = results.violations.filter((violation) =>
      violation.impact === "serious" || violation.impact === "critical"
    );

    expect(severeViolations).toEqual([]);
  });
});
