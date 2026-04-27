"use client";

import { useState, useMemo } from "react";
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

type FilterPeriod = "1D" | "7D" | "30D" | "All";

const FILTERS: FilterPeriod[] = ["1D", "7D", "30D", "All"];

function startOfPeriod(period: FilterPeriod): Date | null {
  if (period === "All") return null;
  const now = new Date();
  if (period === "1D") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const days = period === "7D" ? 7 : 30;
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}

export function SessionView({ data }: { data: SessionResponse }) {
  const [filter, setFilter] = useState<FilterPeriod>("1D");

  const filteredSessions = useMemo(() => {
    const cutoff = startOfPeriod(filter);
    const filtered = cutoff
      ? data.sessions.filter((s) => s.startTime && new Date(s.startTime) >= cutoff)
      : [...data.sessions];
    // ascending: oldest first
    return filtered.sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [data.sessions, filter]);

  const totals = useMemo(() => ({
    inputTokens: filteredSessions.reduce((s, d) => s + d.inputTokens, 0),
    outputTokens: filteredSessions.reduce((s, d) => s + d.outputTokens, 0),
    cacheCreationTokens: filteredSessions.reduce((s, d) => s + d.cacheCreationTokens, 0),
    cacheReadTokens: filteredSessions.reduce((s, d) => s + d.cacheReadTokens, 0),
    totalTokens: filteredSessions.reduce((s, d) => s + d.totalTokens, 0),
    totalCost: filteredSessions.reduce((s, d) => s + d.totalCost, 0),
  }), [filteredSessions]);

  return (
    <div className="space-y-4">
      <OverviewStats totals={totals} label={`${filteredSessions.length} sessions`} />

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={[
                    "px-2.5 py-0.5 rounded text-xs font-medium transition-colors",
                    filter === f
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  ].join(" ")}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sessions in this period
            </p>
          ) : (
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
                {filteredSessions.map((s) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
