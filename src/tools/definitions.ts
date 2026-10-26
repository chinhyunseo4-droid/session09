import type OpenAI from "openai";

// 단계별로 검증한 행사 도구 정의.
export const toolDefinitions: OpenAI.Responses.FunctionTool[] = [
  {
    type: "function",
    name: "search_events",
    description: "행사 기획 요청의 유사 사례를 찾을 때 로컬 가상 행사 샘플을 검색한다. 실제 행사 DB나 웹 검색이 아니다. 읽기 전용이며 결과에 출처가 포함된다.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "행사 분야 일반 키워드, 1~120자. 개인정보·기밀 제외." },
        region: { type: ["string", "null"], description: "지역, 1~80자. 제한이 없으면 null." },
        limit: { type: "integer", minimum: 1, maximum: 10, description: "최대 결과 수. 보통 5." },
      },
      required: ["keyword", "region", "limit"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "get_event_details",
    description: "search_events에서 찾은 후보를 비교하기 위해 상세 정보를 조회할 때 사용한다. 읽기 전용 가상 자료이며 없는 정보는 찾지 못함으로 반환한다.",
    strict: true,
    parameters: {
      type: "object",
      properties: { event_ids: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 } },
      required: ["event_ids"], additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "save_report",
    description: "상세 조회 후 조언을 정리해 저장할 초안을 준비할 때 사용한다. 이 호출은 DB에 쓰지 않는다. 실제 쓰기는 화면의 저장할까요? y/n에서 사람이 y로 확인한 뒤 서버가 별도로 실행한다. 재호출하지 않는다.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", maxLength: 120 },
        summary: { type: "string", maxLength: 1000 },
        suggestions: { type: "array", items: { type: "string", maxLength: 240 }, minItems: 1, maxItems: 5 },
        risks: { type: "array", items: { type: "string", maxLength: 240 }, minItems: 1, maxItems: 5 },
      },
      required: ["title", "summary", "suggestions", "risks"], additionalProperties: false,
    },
  },
];
