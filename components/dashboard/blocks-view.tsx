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
import { Badge } from "@/components/ui/badge";
import { OverviewStats } from "./overview-stats";
import { CostChart } from "./cost-chart";
import { formatCost, formatTokens, shortModelName, modelColor } from "@/lib/utils";
import type { BlocksResponse } from "@/lib/types";

export function BlocksView({ data }: { data: BlocksResponse }) {
  const { blocks } = data;
  const totals = data.totals ?? {
    inputTokens: blocks.reduce((s, d) => s + d.inputTokens, 0),
    outputTokens: blocks.reduce((s, d) => s + d.outputTokens, 0),
    cacheCreationTokens: blocks.reduce((s, d) => s + d.cacheCreationTokens, 0),
    cacheReadTokens: blocks.reduce((s, d) => s + d.cacheReadTokens, 0),
    totalTokens: blocks.reduce((s, d) => s + d.totalTokens, 0),
    totalCost: blocks.reduce((s, d) => s + d.totalCost, 0),
  };

  const chartData = blocks.map((b, i) => ({
    label: b.startTime
      ? new Date(b.startTime).toLocaleDateString("en-US", { month: "numeric", day: "numeric" }) +
        " " +
        new Date(b.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : `Block ${i + 1}`,
    cost: b.totalCost,
  }));

  return (
    <div className="space-y-4">
      <OverviewStats totals={totals} label={`${blocks.length} billing blocks`} />

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">Spend per 5-Hour Block</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <CostChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">Billing Blocks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Tokens</TableHead>
                <TableHead className="hidden md:table-cell">Models</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...blocks].reverse().map((b, i) => (
                <TableRow key={i} className={b.isActive ? "bg-primary/5" : ""}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {b.startTime ? new Date(b.startTime).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {b.isActive ? (
                      <span className="text-primary">active</span>
                    ) : b.endTime ? (
                      new Date(b.endTime).toLocaleTimeString()
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-sm">
                    {formatCost(b.totalCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground text-sm hidden sm:table-cell">
                    {formatTokens(b.totalTokens)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {b.modelsUsed?.map((m) => (
                        <Badge
                          key={m}
                          variant="secondary"
                          className="text-xs font-mono px-1.5 py-0"
                          style={{ borderColor: modelColor(m) }}
                        >
                          {shortModelName(m)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {b.isActive && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
