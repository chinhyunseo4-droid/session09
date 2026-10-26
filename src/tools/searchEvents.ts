import "server-only";

// 루프 검증을 위한 가상 자료. 실제 행사·실제 출처 URL로 인용하지 않는다.
export const eventSamples = [
  { id: "sample-1", name: "대학생 AI 해커톤 (가상)", region: "서울", format: "팀별 문제 해결 및 결과 발표", audience: "대학생", tags: ["AI", "해커톤", "개발"], source: "src/tools/searchEvents.ts#sample-1 (가상 실습 자료)" },
  { id: "sample-2", name: "청년 기획자 네트워킹 (가상)", region: "서울", format: "소그룹 소개 및 주제별 대화", audience: "청년 기획자", tags: ["네트워킹", "교류"], source: "src/tools/searchEvents.ts#sample-2 (가상 실습 자료)" },
  { id: "sample-3", name: "AI 입문 워크숍 (가상)", region: "부산", format: "입문 강의 및 실습", audience: "입문자", tags: ["AI", "교육", "워크숍"], source: "src/tools/searchEvents.ts#sample-3 (가상 실습 자료)" },
];

export async function searchEvents(input: { keyword: string; region: string | null; limit: number }) {
  const terms = input.keyword.toLocaleLowerCase("ko").split(/\s+/).filter(Boolean);
  const events = eventSamples.filter((event) => {
    const text = [event.name, event.audience, ...event.tags].join(" ").toLocaleLowerCase("ko");
    return terms.some((term) => text.includes(term)) && (!input.region || event.region.includes(input.region.trim()));
  }).slice(0, input.limit);
  return { source_type: "fictional_local_samples", count: events.length, events, message: events.length ? "가상 실습 자료입니다." : "찾지 못함" };
}
