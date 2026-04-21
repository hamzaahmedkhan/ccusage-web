import { NextRequest, NextResponse } from "next/server";
import { runCcusage } from "@/lib/ccusage";

const ALLOWED_VIEWS = ["daily", "monthly", "weekly", "session", "blocks"] as const;
type View = (typeof ALLOWED_VIEWS)[number];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeBlocks(raw: any) {
  const blocks = (raw.blocks ?? [])
    .filter((b: any) => !b.isGap)
    .map((b: any) => ({
      startTime: b.startTime,
      endTime: b.endTime,
      isActive: b.isActive ?? false,
      inputTokens: b.tokenCounts?.inputTokens ?? 0,
      outputTokens: b.tokenCounts?.outputTokens ?? 0,
      cacheCreationTokens: b.tokenCounts?.cacheCreationInputTokens ?? 0,
      cacheReadTokens: b.tokenCounts?.cacheReadInputTokens ?? 0,
      totalTokens: b.totalTokens ?? 0,
      totalCost: b.costUSD ?? 0,
      modelsUsed: b.models ?? [],
      modelBreakdowns: [],
    }));
  return { blocks };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSessions(raw: any) {
  const sessions = (raw.sessions ?? []).map((s: any) => ({
    ...s,
    startTime: s.startTime ?? s.lastActivity ?? null,
  }));
  return { sessions, totals: raw.totals };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const view = (searchParams.get("view") ?? "daily") as View;

  if (!ALLOWED_VIEWS.includes(view)) {
    return NextResponse.json({ error: "Invalid view" }, { status: 400 });
  }

  try {
    const raw = runCcusage(view);
    const data =
      view === "blocks"
        ? normalizeBlocks(raw)
        : view === "session"
          ? normalizeSessions(raw)
          : raw;
    return NextResponse.json(data);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    // Only expose internals in dev; production returns a safe generic message
    const message =
      process.env.NODE_ENV === "development"
        ? detail
        : "Failed to fetch usage data. Is ccusage installed?";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
