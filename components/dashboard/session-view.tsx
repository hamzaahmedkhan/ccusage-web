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
import { formatCost, formatTokens, shortModelName, modelColor } from "@/lib/utils";
import type { SessionResponse } from "@/lib/types";

export function SessionView({ data }: { data: SessionResponse }) {
  const { sessions } = data;
  const totals = data.totals ?? {
    inputTokens: sessions.reduce((s, d) => s + d.inputTokens, 0),
    outputTokens: sessions.reduce((s, d) => s + d.outputTokens, 0),
    cacheCreationTokens: sessions.reduce((s, d) => s + d.cacheCreationTokens, 0),
    cacheReadTokens: sessions.reduce((s, d) => s + d.cacheReadTokens, 0),
    totalTokens: sessions.reduce((s, d) => s + d.totalTokens, 0),
    totalCost: sessions.reduce((s, d) => s + d.totalCost, 0),
  };

  return (
    <div className="space-y-4">
      <OverviewStats totals={totals} label={`${sessions.length} sessions`} />

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-medium">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Started</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Tokens</TableHead>
                <TableHead className="hidden md:table-cell">Project</TableHead>
                <TableHead className="hidden lg:table-cell">Models</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...sessions].reverse().map((s) => (
                <TableRow key={s.sessionId}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {s.startTime ? new Date(s.startTime).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-sm">
                    {formatCost(s.totalCost)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground text-sm hidden sm:table-cell">
                    {formatTokens(s.totalTokens)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px]">
                    {s.projectPath && (
                      <span className="text-xs text-muted-foreground truncate block font-mono">
                        {s.projectPath.split("/").pop()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {s.modelsUsed?.map((m) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
