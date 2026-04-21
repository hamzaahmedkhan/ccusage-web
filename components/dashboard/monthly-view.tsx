"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ModelBreakdownChart } from "./model-breakdown";
import { TokenBreakdown } from "./token-breakdown";
import { OverviewStats } from "./overview-stats";
import { formatCost, formatTokens, shortModelName, modelColor, aggregateModelBreakdowns } from "@/lib/utils";
import type { MonthlyResponse } from "@/lib/types";

export function MonthlyView({ data }: { data: MonthlyResponse }) {
  const { monthly, totals } = data;
  const aggregatedTotals = totals ?? {
    inputTokens: monthly.reduce((s, d) => s + d.inputTokens, 0),
    outputTokens: monthly.reduce((s, d) => s + d.outputTokens, 0),
    cacheCreationTokens: monthly.reduce((s, d) => s + d.cacheCreationTokens, 0),
    cacheReadTokens: monthly.reduce((s, d) => s + d.cacheReadTokens, 0),
    totalTokens: monthly.reduce((s, d) => s + d.totalTokens, 0),
    totalCost: monthly.reduce((s, d) => s + d.totalCost, 0),
  };
  const allBreakdowns = monthly.flatMap((m) => m.modelBreakdowns);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="font-mono text-primary">{formatCost(payload[0].value)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OverviewStats totals={aggregatedTotals} label={`${monthly.length} months shown`} />

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={monthly.map((m) => ({ label: m.month, cost: m.totalCost }))}
              margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                {monthly.map((m) => (
                  <Cell key={m.month} fill="#3b82f6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ModelBreakdownChart breakdowns={aggregateModelBreakdowns(allBreakdowns)} />
        <TokenBreakdown totals={aggregatedTotals} />
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Cache Read</TableHead>
                <TableHead className="hidden md:table-cell">Top Model</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...monthly].reverse().map((m) => {
                const topModel = [...(m.modelBreakdowns ?? [])].sort((a, b) => b.cost - a.cost)[0];
                return (
                  <TableRow key={m.month}>
                    <TableCell className="font-mono text-sm">{m.month}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCost(m.totalCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground text-sm">
                      {formatTokens(m.totalTokens)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground text-sm hidden sm:table-cell">
                      {formatTokens(m.cacheReadTokens)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {topModel && (
                        <span
                          className="text-xs font-mono"
                          style={{ color: modelColor(topModel.modelName) }}
                        >
                          {shortModelName(topModel.modelName)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
