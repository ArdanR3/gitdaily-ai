import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

function loadDashboardPassword(): string {
  if (process.env.DASHBOARD_PASSWORD?.trim()) {
    return process.env.DASHBOARD_PASSWORD.trim();
  }
  for (const envFile of [".env.local", ".env"]) {
    const fullPath = path.join(process.cwd(), envFile);
    if (!fs.existsSync(fullPath)) continue;
    const raw = fs.readFileSync(fullPath, "utf-8");
    for (const line of raw.split(/\r?\n/)) {
      if (line.startsWith("DASHBOARD_PASSWORD=")) {
        const val = line.slice("DASHBOARD_PASSWORD=".length).trim().replace(/^["']|["']$/g, "");
        if (val) return val;
      }
    }
  }
  throw new Error("DASHBOARD_PASSWORD tidak ditemukan di environment, .env.local, atau .env.");
}

async function loginToDashboard(page: Page) {
  const password = loadDashboardPassword();
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL("http://localhost:3000/", { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
}

test.describe("GitDaily AI — V2 Regression Suite", () => {
  test("1. Auth & proteksi route mengarahkan sesi kosong ke /login dan menolak API 401", async ({ browser, request }) => {
    const unauthContext = await browser.newContext();
    const page = await unauthContext.newPage();

    for (const protectedRoute of ["/", "/materials", "/settings"]) {
      await page.goto(protectedRoute, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/login/);
    }

    const apiRes = await request.get("/api/repos");
    expect(apiRes.status()).toBe(401);

    await unauthContext.close();
  });

  test("2. Security Guard mengembalikan 403 saat mencoba membuka kunci repo Private", async ({ page }) => {
    await loginToDashboard(page);

    const guardCheck = await page.evaluate(async () => {
      const reposRes = await fetch("/api/repos");
      const data = (await reposRes.json()) as {
        repositories?: Array<{ id: number; name: string; isPrivate: boolean; isProtected: boolean }>;
      };
      const privateRepo = (data.repositories || []).find((r) => r.isPrivate);
      if (!privateRepo) return { skipped: true as const };

      const patchRes = await fetch("/api/repos/guard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: privateRepo.id, isProtected: false }),
      });

      const verifyRes = await fetch("/api/repos");
      const verifyData = (await verifyRes.json()) as {
        repositories?: Array<{ id: number; isProtected: boolean }>;
      };
      const stillLocked = verifyData.repositories?.find((r) => r.id === privateRepo.id)?.isProtected;

      return {
        skipped: false as const,
        repoName: privateRepo.name,
        patchStatus: patchRes.status,
        stillLocked,
      };
    });

    expect(guardCheck.skipped).toBe(false);
    if (!guardCheck.skipped) {
      expect(guardCheck.patchStatus).toBe(403);
      expect(guardCheck.stillLocked).toBe(true);
    }
  });

  test("3. Dashboard GITBOY-01 & /materials FIG 02 merender + EXPLODE VIEW tanpa console error", async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await loginToDashboard(page);

    // Dashboard: FIG 01 GITBOY-01
    const fig01 = page.locator('section[aria-label="FIG 01 GITBOY-01 Commit Deck Anatomy"]');
    await expect(fig01).toBeVisible({ timeout: 15_000 });
    const fig01Explode = fig01.getByRole("button", { name: /EXPLODE VIEW/i });
    await expect(fig01Explode).toBeVisible();
    await fig01Explode.click();
    await expect(fig01.getByRole("button", { name: /ASSEMBLE/i })).toBeVisible();
    await fig01.getByRole("button", { name: /ASSEMBLE/i }).click();

    // /materials: FIG 02 Knowledge Chunker
    await page.goto("/materials", { waitUntil: "networkidle" });
    const fig02 = page.locator('section[aria-label="FIG 02 Knowledge Chunker Anatomy"]');
    await expect(fig02).toBeVisible({ timeout: 15_000 });
    await expect(fig02.getByText(/KNOWLEDGE CHUNKER/i)).toBeVisible();

    const fig02Explode = fig02.getByRole("button", { name: /EXPLODE VIEW/i });
    await expect(fig02Explode).toBeVisible();
    await fig02Explode.click();
    await expect(fig02.getByRole("button", { name: /ASSEMBLE/i })).toBeVisible();
    await fig02.getByRole("button", { name: /ASSEMBLE/i }).click();

    // Verify interactive SVG stage button accessibility attributes
    const svgStageBtn = fig02.locator('svg g[role="button"]').first();
    await expect(svgStageBtn).toHaveAttribute("tabindex", "0");
    await expect(svgStageBtn).toHaveAttribute("aria-label", /.+/);

    // /settings: verify BRANCH_PR mode option is rendered
    await page.goto("/settings", { waitUntil: "networkidle" });
    await expect(page.getByText(/Branch \+ Pull Request/i)).toBeVisible();

    expect(consoleErrors, `Console errors: ${consoleErrors.join("; ")}`).toEqual([]);
    expect(pageErrors, `Page errors: ${pageErrors.join("; ")}`).toEqual([]);
  });

  test("4. Audit Mobile PWA (375x812): 0 overflow, input >= 16px, tombol aksi >= 44px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginToDashboard(page);

    for (const route of ["/", "/materials", "/settings"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      const metrics = await page.evaluate(() => {
        const overflowPx = document.documentElement.scrollWidth - window.innerWidth;

        const smallInputs: Array<{ id: string; tag: string; fontSize: number }> = [];
        for (const el of Array.from(document.querySelectorAll("input, textarea"))) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (rect.width === 0 || rect.height === 0 || style.display === "none" || style.visibility === "hidden") {
            continue;
          }
          const typeAttr = (el.getAttribute("type") || "").toLowerCase();
          if (typeAttr === "file" || typeAttr === "hidden") continue;
          const fontSize = Number.parseFloat(style.fontSize);
          if (fontSize < 16) {
            smallInputs.push({ id: el.id || el.getAttribute("placeholder") || el.tagName, tag: el.tagName, fontSize });
          }
        }

        const smallButtons: Array<{ label: string; height: number }> = [];
        for (const el of Array.from(document.querySelectorAll("button.nb-btn, button.nb-btn-sm, button[type='submit']"))) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (rect.width === 0 || rect.height === 0 || style.display === "none" || style.visibility === "hidden") {
            continue;
          }
          if (rect.height < 43.5) {
            smallButtons.push({
              label: (el.textContent || el.getAttribute("aria-label") || "button").trim().slice(0, 40),
              height: Math.round(rect.height * 10) / 10,
            });
          }
        }

        return { overflowPx, smallInputs, smallButtons };
      });

      expect(metrics.overflowPx, `Horizontal overflow on ${route}: +${metrics.overflowPx}px`).toBeLessThanOrEqual(0);
      expect(metrics.smallInputs, `Inputs < 16px on ${route}: ${JSON.stringify(metrics.smallInputs)}`).toEqual([]);
      expect(metrics.smallButtons, `Action buttons < 44px on ${route}: ${JSON.stringify(metrics.smallButtons)}`).toEqual([]);
    }
  });
});
