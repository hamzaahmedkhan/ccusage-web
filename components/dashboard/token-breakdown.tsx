"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTokens } from "@/lib/utils";
import type { Totals } from "@/lib/types";

interface TokenBreakdownProps {
  totals: Totals;
}

const SEGMENTS = [
  { key: "cacheReadTokens", label: "Cache Read", color: "#10b981" },
  { key: "cacheCreationTokens", label: "Cache Write", color: "#f59e0b" },
  { key: "outputTokens", label: "Output", color: "#3b82f6" },
  { key: "inputTokens", label: "Input", color: "#8b5cf6" },
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
      <p className="font-medium">{payload[0].name}</p>
      <p className="font-mono">{formatTokens(payload[0].value)}</p>
    </div>
  );
}

export function TokenBreakdown({ totals }: TokenBreakdownProps) {
  const data = SEGMENTS.map((s) => ({
    name: s.label,
    value: totals[s.key],
    color: s.color,
  })).filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium">Token Distribution</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={72}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--background)"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>{value}</span>
              )}
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
