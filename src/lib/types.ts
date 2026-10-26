export type ReportDraft = { title: string; summary: string; findings: string[] };
export type PendingReport = { token: string; draft: ReportDraft; expiresAt: number };

export type AgentStep = {
  name: string;
  label: string;
  input: string;
  output: string;
  status: "done" | "error";
};

export type AgentRunResult = {
  reply: string;
  steps: AgentStep[];
  reportSaved: boolean;
  pendingReport?: PendingReport;
};

export type ToolContext = {
  hasSearchedIdeas: boolean;
  hasMarketInfo: boolean;
  eventIds?: string[];
  detailIds?: string[];
  pendingReport?: PendingReport;
};
