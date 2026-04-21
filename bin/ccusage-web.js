#!/usr/bin/env node
"use strict";

const { spawnSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const appDir = path.join(__dirname, "..");
const nextBin = path.join(appDir, "node_modules", ".bin", "next");
const port = process.env.PORT ?? "3000";

function open(url) {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  try {
    // spawnSync avoids shell interpolation of the URL
    spawnSync(cmd, [url], { stdio: "ignore" });
  } catch {}
}

const buildDir = path.join(appDir, ".next");
const needsBuild = !fs.existsSync(buildDir);

if (needsBuild) {
  console.log("Building ccusage-web (first run — this takes ~30s)…");
  const build = spawnSync(nextBin, ["build"], { cwd: appDir, stdio: "inherit" });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

console.log(`\nStarting ccusage-web on http://localhost:${port}\n`);

const server = spawn(nextBin, ["start", "--port", port], {
  cwd: appDir,
  stdio: "inherit",
});

setTimeout(() => open(`http://localhost:${port}`), 1500);

process.on("SIGINT", () => server.kill("SIGINT"));
process.on("SIGTERM", () => server.kill("SIGTERM"));
