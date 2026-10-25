import type OpenAI from "openai";

export const toolDefinitions: OpenAI.Responses.FunctionTool[] = [
  {
    type: "function",
    name: "search_ideas",
    description: "아이디어 테이블에서 요청과 관련된 앱 아이디어를 검색합니다. 첫 번째로 호출하세요.",
    strict: true,
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "검색할 앱 분야나 키워드" } },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_market_info",
    description: "시드 데이터에 포함된 시장 참고자료를 조회합니다. search_ideas 다음에 호출하세요.",
    strict: true,
    parameters: {
      type: "object",
      properties: { category: { type: "string", description: "시장 자료를 찾을 카테고리" } },
      required: ["category"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "save_report",
    description: "검색과 시장 자료를 바탕으로 검증 요약을 Supabase에 저장합니다. 마지막 도구로 호출하세요.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        findings: { type: "array", items: { type: "string" } },
      },
      required: ["title", "summary", "findings"],
      additionalProperties: false,
    },
  },
];
