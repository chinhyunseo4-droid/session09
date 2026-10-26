import type OpenAI from "openai";

// 스텝 4: 모델에 공개하는 도구는 읽기 도구 하나뿐이다.
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
];
