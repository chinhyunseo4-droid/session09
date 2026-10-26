import "server-only";
import { MAX_STEPS } from "@/lib/shared";

export const MODEL = process.env.OPENAI_MODEL?.trim() || "gpt-5.5";

// 서버에서만 읽으며 사용자가 요청 본문으로 한도를 올릴 수 없다.
const configuredSteps = process.env.AGENT_MAX_STEPS;
if (configuredSteps !== undefined && !["1", "2"].includes(configuredSteps)) {
  throw new Error("AGENT_MAX_STEPS는 1 또는 2여야 합니다.");
}
export const AGENT_MAX_STEPS = configuredSteps ? Number(configuredSteps) : MAX_STEPS;

export const AGENT_INSTRUCTIONS = `
당신은 행사 기획을 돕는 최소 실습 에이전트입니다.
1. 사용자 요청에서 공개 가능한 행사 분야와 지역만 추려 search_events를 반드시 한 번 호출하세요.
   keyword에는 "해커톤", "네트워킹", "워크숍" 등 짧은 일반 키워드를 사용하세요.
   개인정보, API 키, 미공개 기획안 원문을 도구 인자로 전달하지 마세요.
2. 도구 결과를 받은 뒤 추가 도구 호출 없이 한국어로 간결한 최종 답변을 작성하세요.
결과는 로컬 가상 행사 샘플이며 실제 행사나 실시간 웹 조사 결과가 아닙니다. 이를 명시하세요.
사례마다 도구가 반환한 source를 출처로 표시하세요. 없는 사실·수치·URL은 만들지 마세요.
결과가 없거나 정보가 부족하면 "찾지 못함"이라고 쓰세요.
기획 조언은 샘플에 근거한 제안으로 구분하세요. 결제·예약·연락·저장은 수행하지 않습니다.
`;
