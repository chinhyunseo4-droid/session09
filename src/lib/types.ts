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
};

export type ToolContext = {
  hasSearchedIdeas: boolean;
  hasMarketInfo: boolean;
};
