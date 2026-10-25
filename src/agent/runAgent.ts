import "server-only";
import OpenAI from "openai";
import { AGENT_INSTRUCTIONS, MODEL } from "@/config/demo";
import { MAX_STEPS } from "@/lib/shared";
import type { AgentRunResult, AgentStep, ToolContext } from "@/lib/types";
import { toolDefinitions } from "@/tools/definitions";
import { getMarketInfo } from "@/tools/getMarketInfo";
import { saveReport } from "@/tools/saveReport";
import { searchIdeas } from "@/tools/searchIdeas";

export class AgentRunError extends Error {
  constructor(message: string, public readonly steps: AgentStep[]) {
    super(message);
  }
}

function readString(value: unknown, key: string, max = 800): string {
  if (!value || typeof value !== "object" || !(key in value)) {
    throw new Error(`도구 입력에 ${key} 값이 없습니다.`);
  }
  const result = (value as Record<string, unknown>)[key];
  if (typeof result !== "string" || !result.trim() || result.length > max) {
    throw new Error(`${key} 값은 1~${max}자 텍스트여야 합니다.`);
  }
  return result.trim();
}

async function executeTool(
  name: string,
  rawArguments: string,
  prompt: string,
  context: ToolContext,
): Promise<{ value: unknown; input: string; output: string }> {
  let args: unknown;
  try {
    args = JSON.parse(rawArguments);
  } catch {
    throw new Error("도구 인자를 JSON으로 읽지 못했습니다.");
  }

  if (name === "search_ideas") {
    const query = readString(args, "query", 120);
    const result = await searchIdeas(query);
    context.hasSearchedIdeas = true;
    return { value: result, input: query, output: `${result.count}개 아이디어를 찾았습니다.` };
  }

  if (name === "get_market_info") {
    if (!context.hasSearchedIdeas) throw new Error("먼저 search_ideas를 호출하세요.");
    const category = readString(args, "category", 80);
    const result = await getMarketInfo(category);
    context.hasMarketInfo = true;
    return { value: result, input: category, output: `${result.count}개 시드 시장 자료를 찾았습니다.` };
  }

  if (name === "save_report") {
    if (!context.hasSearchedIdeas || !context.hasMarketInfo) {
      throw new Error("search_ideas와 get_market_info를 먼저 실행하세요.");
    }
    const title = readString(args, "title", 120);
    const summary = readString(args, "summary", 1000);
    const rawFindings = (args as { findings?: unknown }).findings;
    if (!Array.isArray(rawFindings) || rawFindings.length < 1 || rawFindings.length > 5
      || rawFindings.some((item) => typeof item !== "string" || !item.trim() || item.length > 240)) {
      throw new Error("findings는 1~5개의 240자 이내 문장이어야 합니다.");
    }
    const findings = rawFindings as string[];
    const result = await saveReport({ prompt, title, summary, findings });
    return { value: result, input: title, output: result.message };
  }

  throw new Error(`등록되지 않은 도구입니다: ${name}`);
}

export async function runAgent(prompt: string): Promise<AgentRunResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new AgentRunError("OPENAI_API_KEY를 .env.local에 설정하세요.", []);

  const client = new OpenAI({ apiKey, timeout: 45_000, maxRetries: 0 });
  const steps: AgentStep[] = [];
  const context: ToolContext = { hasSearchedIdeas: false, hasMarketInfo: false };
  let conversation: OpenAI.Responses.ResponseInputItem[] = [{ role: "user", content: prompt }];
  let reportSaved = false;

  for (let round = 0; round < MAX_STEPS; round += 1) {
    let response: OpenAI.Responses.Response;
    try {
      response = await client.responses.create({
        model: MODEL,
        instructions: AGENT_INSTRUCTIONS,
        input: conversation,
        tools: toolDefinitions,
        tool_choice: "auto",
        parallel_tool_calls: false,
        max_output_tokens: 1000,
        store: false,
      });
    } catch (error) {
      const message = error instanceof OpenAI.APIError && error.status === 429
        ? "OpenAI 사용 한도에 도달했습니다. 잠시 후 다시 시도해 주세요."
        : "OpenAI 응답을 받지 못했습니다. API 키와 모델 설정을 확인해 주세요.";
      throw new AgentRunError(message, steps);
    }

    const calls = response.output.filter(
      (item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === "function_call",
    );
    if (calls.length === 0) {
      const reply = response.output_text?.trim();
      if (!reply) throw new AgentRunError("에이전트 응답이 비어 있습니다.", steps);
      return { reply, steps, reportSaved };
    }

    const outputs: OpenAI.Responses.ResponseInputItem[] = [];
    for (const call of calls) {
      const labels: Record<string, string> = {
        search_ideas: "아이디어 검색",
        get_market_info: "시장 자료 조회",
        save_report: "리포트 저장",
      };
      try {
        const result = await executeTool(call.name, call.arguments, prompt, context);
        steps.push({ name: call.name, label: labels[call.name] ?? call.name, input: result.input, output: result.output, status: "done" });
        if (call.name === "save_report") reportSaved = true;
        outputs.push({ type: "function_call_output", call_id: call.call_id, output: JSON.stringify(result.value) });
      } catch (error) {
        const message = error instanceof Error ? error.message : "도구 실행에 실패했습니다.";
        steps.push({ name: call.name, label: labels[call.name] ?? call.name, input: "인자 검증", output: message, status: "error" });
        throw new AgentRunError(message, steps);
      }
    }

    // 이 요청에는 함수 도구만 등록했으므로 모델 응답을 다음 입력 대화에 이어 붙입니다.
    const responseItems = response.output as OpenAI.Responses.ResponseInputItem[];
    conversation = [...conversation, ...responseItems, ...outputs];
  }

  throw new AgentRunError(`최대 ${MAX_STEPS}회 안에 작업을 마치지 못했습니다.`, steps);
}
