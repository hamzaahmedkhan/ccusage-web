export interface ModelBreakdown {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  cost: number;
}

export interface DailyEntry {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: ModelBreakdown[];
}

export interface MonthlyEntry {
  month: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: ModelBreakdown[];
}

export interface WeeklyEntry {
  week: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: ModelBreakdown[];
}

export interface SessionEntry {
  sessionId: string;
  startTime: string;
  endTime?: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: ModelBreakdown[];
  projectPath?: string;
}

export interface BlockEntry {
  startTime: string;
  endTime: string;
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
  modelsUsed: string[];
  modelBreakdowns: ModelBreakdown[];
  isActive?: boolean;
  durationMinutes?: number;
}

export interface Totals {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  totalTokens: number;
  totalCost: number;
}

export interface DailyResponse {
  daily: DailyEntry[];
  totals?: Totals;
}

export interface MonthlyResponse {
  monthly: MonthlyEntry[];
  totals?: Totals;
}

export interface WeeklyResponse {
  weekly: WeeklyEntry[];
  totals?: Totals;
}

export interface SessionResponse {
  sessions: SessionEntry[];
  totals?: Totals;
}

export interface BlocksResponse {
  blocks: BlockEntry[];
  totals?: Totals;
}

export type ViewType = "daily" | "monthly" | "weekly" | "session" | "blocks";
