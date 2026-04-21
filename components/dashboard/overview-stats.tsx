"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCost, formatTokens } from "@/lib/utils";
import type { Totals } from "@/lib/types";

interface OverviewStatsProps {
  totals: Totals;
  label?: string;
}

export function OverviewStats({ totals, label = "All time" }: OverviewStatsProps) {
  const stats = [
    { title: "Total Cost", value: formatCost(totals.totalCost), sub: label },
    { title: "Total Tokens", value: formatTokens(totals.totalTokens ?? 0), sub: "input + output + cache" },
    { title: "Cache Read", value: formatTokens(totals.cacheReadTokens), sub: `${((totals.cacheReadTokens / Math.max(totals.totalTokens ?? 1, 1)) * 100).toFixed(1)}% of total` },
    { title: "Cache Write", value: formatTokens(totals.cacheCreationTokens), sub: "cache creation tokens" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.title}>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {s.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <p className="text-2xl font-semibold font-mono">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
