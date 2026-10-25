# Session 09 · Agent Lab

사용자의 목표에 따라 에이전트가 도구를 고르고, 서버 코드가 직접 실행하고, 결과를 다시 모델에 전달하는 단일 플로우

```text
입력: AI 반려동물 앱 아이디어를 검증해줘
search_ideas → get_market_info → save_report → 최종 요약
```

## 빠른 시작

필요 환경: Node.js 20.9 이상, OpenAI API 키, Supabase 프로젝트.

1. `.env.example`을 `.env.local`로 복사하고 OpenAI 키·모델, Supabase URL·publishable key를 입력합니다.
2. Supabase SQL Editor에서 `supabase/schema.sql`을 실행한 뒤 `supabase/seed.sql`을 실행합니다.
3. `npm install` 후 `npm run check:env`, `npm run dev`를 실행합니다.
4. 화면의 샘플 요청을 실행하고 우측 로그와 Supabase의 `agent_reports` 테이블을 확인합니다.

환경 점검 스크립트는 값이 설정됐는지만 검사하고 비밀값은 출력하지 않습니다. Supabase publishable key는 브라우저에 노출 가능한 키이며, 두 자료 테이블은 RLS 읽기 정책, 리포트 테이블은 삽입 정책으로 제한합니다. 서비스 롤 키는 사용하지 않습니다.

## 레포 구조

```text
src/
  agent/runAgent.ts       # Responses API 도구 호출 루프와 max_steps
  tools/                  # 검색, 시장 자료 조회, 리포트 저장
  config/demo.ts          # 모델과 에이전트 지침
  lib/                    # Supabase 클라이언트와 공유 타입
  app/api/agent/route.ts  # 입력 검증과 API 오류 처리
  components/AgentDemo.tsx # 목표 입력, 단계별 실행 로그, 결과
scripts/check-env.mjs     # 환경변수 사전 점검
supabase/schema.sql       # RLS가 적용된 실습 테이블
supabase/seed.sql         # 데모 아이디어·시장 참고자료
AGENTS.md                 # 에이전트 도구 공통 실습 규칙
```

`search_ideas`와 `get_market_info`가 읽는 자료는 흐름을 재현하기 위한 가상 시드 데이터입니다. 실제 시장 조사 결과로 인용하지 않습니다. 실습 용도라 익명 리포트 저장을 허용하므로 공개 서비스로 배포하기 전에는 로그인, 사용자별 권한, 쓰기 제한을 추가해야 합니다.

## 실습 확장

새 기능은 `src/tools/`에 서버 함수와 JSON Schema를 추가하고, `src/agent/runAgent.ts`의 실행 맵에 등록합니다. 기존 루프의 대화 기록과 `call_id` 연결은 그대로 유지합니다. 실행 횟수는 `src/lib/shared.ts`의 `MAX_STEPS`에서 조절합니다.
