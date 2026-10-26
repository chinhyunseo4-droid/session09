import "server-only";
import { getSupabase } from "@/lib/supabase";

export type ReportInput = {
  prompt: string;
  title: string;
  summary: string;
  findings: string[];
};

export async function saveReport(input: ReportInput) {
  const { error } = await getSupabase().from("agent_reports").insert({
    prompt: input.prompt,
    title: input.title,
    summary: input.summary,
    findings: input.findings,
  });
  if (error) throw new Error("리포트 저장에 실패했습니다. DB 설정과 쓰기 권한을 확인해주세요.");
  return { saved: true, message: "Supabase agent_reports 테이블에 리포트를 저장했습니다." };
}
