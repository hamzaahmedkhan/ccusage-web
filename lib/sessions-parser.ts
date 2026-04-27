import { readdirSync, readFileSync, statSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";
import type { SessionEntry, Totals } from "./types";

const PROJECTS_DIR = join(homedir(), ".claude", "projects");

// Pricing per 1M tokens (USD) — matched to Anthropic's published rates
const MODEL_PRICING: Record<string, { input: number; output: number; cacheWrite: number; cacheRead: number }> = {
  "claude-opus-4-7": { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  "claude-opus-4": { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-sonnet-4-5": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-3-7-sonnet": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-3-5-sonnet": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-4-5": { input: 0.8, output: 4, cacheWrite: 1, cacheRead: 0.08 },
  "claude-3-5-haiku": { input: 0.8, output: 4, cacheWrite: 1, cacheRead: 0.08 },
  "claude-3-haiku": { input: 0.25, output: 1.25, cacheWrite: 0.3, cacheRead: 0.03 },
  "claude-3-opus": { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
};

function getModelPricing(model: string) {
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];
  for (const key of Object.keys(MODEL_PRICING)) {
    if (model.startsWith(key)) return MODEL_PRICING[key];
  }
  return MODEL_PRICING["claude-sonnet-4-6"];
}

function calculateCost(model: string, usage: Record<string, number>): number {
  const p = getModelPricing(model);
  const M = 1_000_000;
  return (
    (usage.input_tokens ?? 0) * p.input / M +
    (usage.output_tokens ?? 0) * p.output / M +
    (usage.cache_creation_input_tokens ?? 0) * p.cacheWrite / M +
    (usage.cache_read_input_tokens ?? 0) * p.cacheRead / M
  );
}

export function parseSessionsFromJSONL(): { sessions: SessionEntry[]; totals: Totals } {
  const sessions: SessionEntry[] = [];

  let projectDirs: string[];
  try {
    projectDirs = readdirSync(PROJECTS_DIR);
  } catch {
    return { sessions: [], totals: { inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0, totalCost: 0 } };
  }

  for (const projectSlug of projectDirs) {
    const projectPath = join(PROJECTS_DIR, projectSlug);

    try {
      if (!statSync(projectPath).isDirectory()) continue;
    } catch {
      continue;
    }

    let files: string[];
    try {
      files = readdirSync(projectPath);
    } catch {
      continue;
    }

    for (const jsonlFile of files.filter((f) => f.endsWith(".jsonl"))) {
      const sessionId = basename(jsonlFile, ".jsonl");
      const filePath = join(projectPath, jsonlFile);

      let content: string;
      try {
        content = readFileSync(filePath, "utf-8");
      } catch {
        continue;
      }

      let startTime: string | null = null;
      let lastActivity: string | null = null;
      let cwd: string | null = null;
      let inputTokens = 0;
      let outputTokens = 0;
      let cacheCreationTokens = 0;
      let cacheReadTokens = 0;
      let totalCost = 0;
      const modelsUsed = new Set<string>();
      const modelBreakdowns = new Map<string, {
        inputTokens: number;
        outputTokens: number;
        cacheCreationTokens: number;
        cacheReadTokens: number;
        cost: number;
      }>();

      for (const line of content.split("\n")) {
        if (!line.trim()) continue;

        let entry: Record<string, unknown>;
        try {
          entry = JSON.parse(line) as Record<string, unknown>;
        } catch {
          continue;
        }

        const ts = entry.timestamp as string | undefined;
        if (ts) {
          if (!startTime) startTime = ts;
          lastActivity = ts;
        }

        if (!cwd && typeof entry.cwd === "string") {
          cwd = entry.cwd;
        }

        if (entry.type !== "assistant") continue;

        const message = entry.message as Record<string, unknown> | undefined;
        if (!message) continue;

        const usage = message.usage as Record<string, number> | undefined;
        if (!usage) continue;

        const model = (message.model as string) ?? "";
        const inToks = usage.input_tokens ?? 0;
        const outToks = usage.output_tokens ?? 0;
        const cacheCreate = usage.cache_creation_input_tokens ?? 0;
        const cacheRead = usage.cache_read_input_tokens ?? 0;

        inputTokens += inToks;
        outputTokens += outToks;
        cacheCreationTokens += cacheCreate;
        cacheReadTokens += cacheRead;

        if (model) {
          modelsUsed.add(model);
          const cost = calculateCost(model, usage);
          totalCost += cost;

          const existing = modelBreakdowns.get(model);
          if (existing) {
            existing.inputTokens += inToks;
            existing.outputTokens += outToks;
            existing.cacheCreationTokens += cacheCreate;
            existing.cacheReadTokens += cacheRead;
            existing.cost += cost;
          } else {
            modelBreakdowns.set(model, {
              inputTokens: inToks,
              outputTokens: outToks,
              cacheCreationTokens: cacheCreate,
              cacheReadTokens: cacheRead,
              cost,
            });
          }
        }
      }

      // Skip empty sessions (no API calls made)
      if (inputTokens === 0 && outputTokens === 0 && cacheCreationTokens === 0 && cacheReadTokens === 0) {
        continue;
      }

      sessions.push({
        sessionId,
        startTime: startTime ?? "",
        endTime: lastActivity ?? undefined,
        projectPath: cwd ?? "",
        inputTokens,
        outputTokens,
        cacheCreationTokens,
        cacheReadTokens,
        totalTokens: inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens,
        totalCost,
        modelsUsed: Array.from(modelsUsed),
        modelBreakdowns: Array.from(modelBreakdowns.entries()).map(([modelName, b]) => ({
          modelName,
          ...b,
        })),
      });
    }
  }

  sessions.sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });

  const totals: Totals = {
    inputTokens: sessions.reduce((s, d) => s + d.inputTokens, 0),
    outputTokens: sessions.reduce((s, d) => s + d.outputTokens, 0),
    cacheCreationTokens: sessions.reduce((s, d) => s + d.cacheCreationTokens, 0),
    cacheReadTokens: sessions.reduce((s, d) => s + d.cacheReadTokens, 0),
    totalTokens: sessions.reduce((s, d) => s + d.totalTokens, 0),
    totalCost: sessions.reduce((s, d) => s + d.totalCost, 0),
  };

  return { sessions, totals };
}
