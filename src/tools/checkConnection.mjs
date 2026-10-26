import "server-only";
import { createClient } from "@supabase/supabase-js";

// CLI 서버 연결 검사 전용. 행 내용은 반환하거나 로그에 남기지 않는다.
export async function checkSupabaseConnection(url, key) {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) },
  });
  const { error } = await client.from("ideas").select("id").limit(1);
  if (error) throw new Error("Supabase 조회 실패");
}
