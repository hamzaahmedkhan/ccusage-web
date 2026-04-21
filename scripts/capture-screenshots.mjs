#!/usr/bin/env node
// Run with: npx playwright@latest --yes node scripts/capture-screenshots.mjs
// Or:       node --experimental-vm-modules scripts/capture-screenshots.mjs
import { chromium } from "playwright";
import { mkdir } from "fs/promises";

const BASE = "http://localhost:3000";
const OUT = "docs";

const TABS = [
  { label: "Daily",    selector: 'button:has-text("Daily")',    file: "screenshot-daily.png" },
  { label: "Monthly",  selector: 'button:has-text("Monthly")',  file: "screenshot-monthly.png" },
  { label: "Sessions", selector: 'button:has-text("Sessions")', file: "screenshot-sessions.png" },
  { label: "Blocks",   selector: 'button:has-text("Blocks")',   file: "screenshot-blocks.png" },
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

for (const tab of TABS) {
  console.log(`Capturing ${tab.label}…`);
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.click(tab.selector);
  await page.waitForTimeout(2000); // let charts render
  await page.screenshot({ path: `${OUT}/${tab.file}`, fullPage: true });
  console.log(`  → ${OUT}/${tab.file}`);
}

await browser.close();
console.log("\nAll screenshots saved.");
