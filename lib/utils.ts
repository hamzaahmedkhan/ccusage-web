import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ModelBreakdown } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function aggregateModelBreakdowns(breakdowns: ModelBreakdown[]): ModelBreakdown[] {
  const map = new Map<string, ModelBreakdown>();
  for (const b of breakdowns) {
    const existing = map.get(b.modelName);
    if (existing) {
      existing.inputTokens += b.inputTokens;
      existing.outputTokens += b.outputTokens;
      existing.cacheCreationTokens += b.cacheCreationTokens;
      existing.cacheReadTokens += b.cacheReadTokens;
      existing.cost += b.cost;
    } else {
      map.set(b.modelName, { ...b });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.cost - a.cost);
}

export const MODEL_COLORS: Record<string, string> = {
  "claude-opus-4-7": "#8b5cf6",
  "claude-opus-4-6": "#7c3aed",
  "claude-sonnet-4-6": "#3b82f6",
  "claude-sonnet-4-5": "#2563eb",
  "claude-haiku-4-5-20251001": "#10b981",
  "claude-haiku-4-5": "#059669",
};

export function modelColor(name: string): string {
  return MODEL_COLORS[name] ?? "#6b7280";
}

export function shortModelName(name: string): string {
  return name.replace("claude-", "").replace(/-\d{8}$/, "");
}
