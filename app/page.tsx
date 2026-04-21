"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DailyView } from "@/components/dashboard/daily-view";
import { MonthlyView } from "@/components/dashboard/monthly-view";
import { SessionView } from "@/components/dashboard/session-view";
import { BlocksView } from "@/components/dashboard/blocks-view";
import type {
  DailyResponse,
  MonthlyResponse,
  SessionResponse,
  BlocksResponse,
  ViewType,
} from "@/lib/types";

const VIEWS: { value: ViewType; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "session", label: "Sessions" },
  { value: "blocks", label: "Blocks" },
];

const AUTO_REFRESH_MS = 2 * 60 * 1000;

type ViewData = DailyResponse | MonthlyResponse | SessionResponse | BlocksResponse | null;

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[260px] rounded-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton className="h-[260px] rounded-lg" />
        <Skeleton className="h-[260px] rounded-lg" />
      </div>
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("daily");
  const [cache, setCache] = useState<Partial<Record<ViewType, ViewData>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchView = useCallback(async (view: ViewType, bustCache = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/usage?view=${view}${bustCache ? `&t=${Date.now()}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setCache((prev) => ({ ...prev, [view]: data }));
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cache[activeView]) {
      fetchView(activeView);
    }
  }, [activeView, cache, fetchView]);

  useEffect(() => {
    const id = setInterval(() => fetchView(activeView, true), AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [activeView, fetchView]);

  const data = cache[activeView];

  function renderView() {
    if (loading && !data) return <LoadingSkeleton />;
    if (error)
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          <p className="font-semibold mb-1">Failed to load usage data</p>
          <p className="font-mono text-xs opacity-80">{error}</p>
          <p className="mt-2 text-xs opacity-70">
            Make sure <code className="font-mono">ccusage</code> is installed or available via npx.
          </p>
        </div>
      );
    if (!data) return null;

    switch (activeView) {
      case "daily":
        return <DailyView data={data as DailyResponse} />;
      case "monthly":
        return <MonthlyView data={data as MonthlyResponse} />;
      case "session":
        return <SessionView data={data as SessionResponse} />;
      case "blocks":
        return <BlocksView data={data as BlocksResponse} />;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg font-semibold tracking-tight">ccusage</span>
            <Badge variant="secondary" className="text-xs font-normal">
              local dashboard
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-muted-foreground animate-pulse">Refreshing…</span>
            )}
            {lastRefresh && !loading && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchView(activeView, true)}
              disabled={loading}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs
          value={activeView}
          onValueChange={(v) => setActiveView(v as ViewType)}
          className="space-y-5"
        >
          <TabsList className="w-full sm:w-auto">
            {VIEWS.map((v) => (
              <TabsTrigger key={v.value} value={v.value} className="flex-1 sm:flex-none">
                {v.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {VIEWS.map((v) => (
            <TabsContent key={v.value} value={v.value} className="mt-0">
              {activeView === v.value && renderView()}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
