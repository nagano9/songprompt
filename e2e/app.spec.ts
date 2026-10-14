import { expect, test, type Page } from "@playwright/test";

const consoleErrors: string[] = [];

async function freshPage(page: Page) {
  consoleErrors.length = 0;
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(String(e)));
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");
}

const outputTab = (page: Page, name: string) => page.locator("aside").getByRole("tab", { name: new RegExp(`^${name}`) });

test.afterEach(() => {
  expect(consoleErrors, "no console errors / hydration mismatches").toEqual([]);
});

test("template → copy → history → rating → insight", async ({ page }) => {
  await freshPage(page);
  await page.getByRole("button", { name: /Folk Akustik Intim/ }).click();
  await expect(page.locator("#genre")).toHaveValue("indie folk");

  await page.getByRole("button", { name: "Copy Prompt" }).click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain("### Style of Music");
  expect(clip).toContain("### Exclude Styles");

  await outputTab(page, "Riwayat").click();
  await page.getByRole("button", { name: "Nilai hasil" }).first().click();
  await page.getByRole("radio", { name: "4 bintang" }).click();
  await page.getByRole("button", { name: "Chorus generik" }).click();
  await page.getByRole("button", { name: "Simpan rating" }).click();
  await expect(page.getByRole("button", { name: "Ubah rating" })).toBeVisible();

  await outputTab(page, "Insight").click();
  await expect(page.getByText("Lagu dinilai")).toBeVisible();
  await expect(page.getByText("Chorus generik ×1")).toBeVisible();
});

test("A/B experiment saves three takes that differ on one axis", async ({ page }) => {
  await freshPage(page);
  await page.getByRole("button", { name: /Lo-fi Tape Hip-hop/ }).click();
  await outputTab(page, "A/B").click();
  await page.getByRole("radio", { name: "Tempo" }).click();
  await expect(page.getByText("72 BPM (−12%)")).toBeVisible();
  await expect(page.getByText("92 BPM (+12%)")).toBeVisible();
  await page.getByRole("button", { name: "Simpan ketiga take ke Riwayat" }).click();
  await outputTab(page, "Riwayat").click();
  await page.getByRole("button", { name: "Eksperimen", exact: true }).click();
  await expect(page.locator("aside li").filter({ hasText: "take" })).toHaveCount(3);
});

test("share link restores the form in a fresh browser", async ({ page, context }) => {
  await freshPage(page);
  await page.getByRole("button", { name: /Keroncong Modern/ }).click();
  await page.getByRole("button", { name: "Salin link share" }).click();
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toMatch(/#p=z/);

  const other = await context.browser()!.newContext();
  const p2 = await other.newPage();
  await p2.goto(url);
  await expect(p2.locator("#genre")).toHaveValue("keroncong");
  await expect(p2.getByText(/Prompt dibuka dari link share/)).toBeVisible();
  expect(p2.url()).not.toContain("#p=");
  await other.close();
});

test("glossary translates Indonesian descriptors", async ({ page }) => {
  await freshPage(page);
  await page.locator("#moods").fill("galau");
  await page.locator("#moods").press("Enter");
  await expect(page.getByText("Diterjemahkan: galau → restless heartache")).toBeVisible();
  await page.locator("#timbre").fill("suara serak");
  await page.getByRole("button", { name: "Terjemahkan" }).first().click();
  await expect(page.locator("#timbre")).toHaveValue("raspy");
});

test("negative budget caps auto negatives", async ({ page }) => {
  await freshPage(page);
  await page.locator("#genre").fill("indie folk");
  await page.locator("#neg-budget").fill("5");
  await expect(page.getByText("5/5")).toBeVisible();
  const exclude = page.locator("aside pre").nth(1);
  await expect(exclude).not.toBeEmpty();
  expect((await exclude.innerText()).split(", ")).toHaveLength(5);
});

test("reference translator fills empty fields only", async ({ page }) => {
  await freshPage(page);
  await page.locator("#genre").fill("indie rock");
  await page.locator("#references").fill("mirip Iwan Fals");
  await page.getByRole("button", { name: "Isi ke form" }).click();
  await expect(page.locator("#genre")).toHaveValue("indie rock");
  await expect(page.locator("#delivery")).toHaveValue(/storytelling/);
});

test("model profile switch changes the style limit", async ({ page }) => {
  await freshPage(page);
  await page.getByRole("button", { name: /Folk Akustik Intim/ }).click();
  await page.getByRole("combobox", { name: "Versi model" }).selectOption("suno-v4");
  await expect(page.locator("aside").getByText(/\/200$/).first()).toBeVisible();
  await outputTab(page, "Saran").click();
  await expect(page.getByText(/Style melebihi batas Suno v4/)).toBeVisible();
});

test("quick mode keeps state when deepening", async ({ page }) => {
  await freshPage(page);
  await page.getByRole("radio", { name: "Cepat" }).click();
  await page.locator("#genre").fill("city pop");
  await page.getByRole("button", { name: /Perdalam ke mode lengkap/ }).click();
  await expect(page.locator("#bpm")).toBeVisible();
  await expect(page.locator("#genre")).toHaveValue("city pop");
});

test("lyric workshop analyses syllables and the AI assist calls the API", async ({ page }) => {
  await page.route("https://api.anthropic.com/v1/messages", async (route) => {
    const req = route.request();
    expect(req.headers()["anthropic-dangerous-direct-browser-access"]).toBe("true");
    expect(req.headers()["x-api-key"]).toBe("sk-ant-test");
    await route.fulfill({ json: { content: [{ type: "text", text: "1. Baris kedua klise." }] } });
  });
  await freshPage(page);
  await page.locator("#lyrics").fill("[Verse 1]\nkertas kuning di laci lemari\nair mata jatuh di pipi");
  await page.getByRole("button", { name: /Lirik workshop/ }).click();
  await expect(page.getByText(/Klise: “air mata”/)).toBeVisible();

  await page.getByRole("button", { name: "Pengaturan" }).click();
  await page.getByLabel("Aktifkan asisten lirik (Claude)").click();
  await page.getByPlaceholder("sk-ant-…").fill("sk-ant-test");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Kritik lirikku" }).click();
  await expect(page.getByText("1. Baris kedua klise.")).toBeVisible();

  // The key must not be persisted unless "remember" is on.
  const stored = await page.evaluate(() => localStorage.getItem("aspb-settings") ?? "");
  expect(stored).not.toContain("sk-ant-test");
});

test("history export → clear → import round-trips", async ({ page }) => {
  await freshPage(page);
  await page.getByRole("button", { name: /Boom Bap 90-an/ }).click();
  await page.getByRole("button", { name: "Copy Prompt" }).click();
  await outputTab(page, "Riwayat").click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ekspor JSON" }).click();
  const file = await (await download).path();

  await page.getByRole("button", { name: "Bersihkan" }).click();
  await page.getByRole("button", { name: "Hapus (kecuali dipin)" }).click();
  await expect(page.getByText("Belum ada riwayat.")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(file!);
  await expect(page.getByText("1 prompt diimpor.")).toBeVisible();
});
