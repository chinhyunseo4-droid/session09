import nextEnv from "@next/env";
import OpenAI from "openai";
import { checkSupabaseConnection } from "../src/tools/checkConnection.mjs";

// Next.js와 같은 환경변수 로딩 규칙을 사용하고 값은 출력하지 않는다.
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const required = ["OPENAI_API_KEY", "OPENAI_MODEL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(`FAIL 환경변수가 비어 있습니다: ${missing.join(", ")}`);
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL.trim();
try {
  if (new URL(url).protocol !== "https:") throw new Error();
} catch {
  console.error("FAIL NEXT_PUBLIC_SUPABASE_URL은 유효한 https:// 주소여야 합니다.");
  process.exit(1);
}
console.log("OK 필수 환경변수 (값은 표시하지 않음)");
try {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY.trim(), timeout: 20000, maxRetries: 0 });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL.trim(),
    input: "Reply with OK.",
    max_output_tokens: 32,
    store: false,
  });
  if (response.status !== "completed" || !response.output_text?.trim()) throw new Error();
  console.log("OK OpenAI 호출");
} catch {
  console.error("FAIL OpenAI 호출: 네트워크, API 키, 모델, 사용 한도를 확인하세요.");
  process.exitCode = 1;
}
try {
  await checkSupabaseConnection(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.trim());
  console.log("OK Supabase 조회 (ideas 테이블, 행 내용은 표시하지 않음)");
} catch {
  console.error("FAIL Supabase 조회: 네트워크, URL, 키, ideas 테이블과 읽기 권한을 확인하세요.");
  process.exitCode = 1;
}
