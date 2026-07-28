import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { siteConfig } from "@/lib/site-config";

describe("robots", () => {
  it("권위 도메인의 sitemap만 안내한다", () => {
    const metadata = robots();

    expect(metadata.sitemap).toBe(`${siteConfig.url}/sitemap.xml`);
    expect(metadata.sitemap).not.toContain("byungskerlog.vercel.app");
  });
});
