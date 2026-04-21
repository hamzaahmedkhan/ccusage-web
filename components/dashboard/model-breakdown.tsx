"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCost, formatTokens, modelColor, shortModelName, aggregateModelBreakdowns } from "@/lib/utils";
import type { ModelBreakdown } from "@/lib/types";

interface ModelBreakdownProps {
  breakdowns: ModelBreakdown[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ModelBreakdown;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg space-y-1">
      <p className="font-medium">{shortModelName(d.modelName)}</p>
      <p className="font-mono text-primary">{formatCost(d.cost)}</p>
      <p className="text-muted-foreground text-xs">
        {formatTokens(d.inputTokens)} in · {formatTokens(d.outputTokens)} out
      </p>
      <p className="text-muted-foreground text-xs">
        {formatTokens(d.cacheReadTokens)} cache read
      </p>
    </div>
  );
}

export function ModelBreakdownChart({ breakdowns }: ModelBreakdownProps) {
  const aggregated = aggregateModelBreakdowns(breakdowns);
  const chartData = aggregated.map((b) => ({
    ...b,
    name: shortModelName(b.modelName),
  }));

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium">Cost by Model</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => `$${v.toFixed(2)}`}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" radius={[3, 3, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.modelName} fill={modelColor(entry.modelName)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-3 space-y-1.5">
          {aggregated.map((b) => (
            <div key={b.modelName} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: modelColor(b.modelName) }}
                />
                <span className="text-muted-foreground truncate font-mono">
                  {shortModelName(b.modelName)}
                </span>
              </div>
              <span className="font-mono font-medium shrink-0 ml-2">{formatCost(b.cost)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
