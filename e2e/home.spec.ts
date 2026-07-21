import { test, expect } from "@playwright/test";

test.describe("Halaman utama", () => {
  test("memuat halaman beranda", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("menampilkan tombol masuk", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /masuk|login|google/i }).first()).toBeVisible({ timeout: 10000 });
  });
});
