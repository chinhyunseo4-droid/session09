import "server-only";
import { randomUUID } from "node:crypto";
import { saveReport } from "@/tools/saveReport";
import type { PendingReport, ReportDraft } from "@/lib/types";

type Entry = { draft: ReportDraft; expiresAt: number; state: "pending" | "saving" | "saved" | "rejected" | "failed" };
const state = globalThis as typeof globalThis & { eventReportApprovals?: Map<string, Entry> };
const entries = state.eventReportApprovals ??= new Map<string, Entry>();
const TTL = 10 * 60_000;

// 추측 불가능한 일회성 토큰은 확인 권한이다. 로그에 기록하지 않는다.
export function prepareReport(draft: ReportDraft): PendingReport {
  for (const [token, entry] of entries) {
    if (entry.expiresAt <= Date.now() && entry.state !== "saving") entries.delete(token);
  }
  if (entries.size >= 100) throw new Error("저장 확인 대기가 많습니다. 잠시 후 다시 시도하세요.");
  const token = randomUUID();
  const expiresAt = Date.now() + TTL;
  const safeDraft = structuredClone(draft);
  entries.set(token, { draft: safeDraft, expiresAt, state: "pending" });
  return { token, draft: safeDraft, expiresAt };
}

export async function confirmReport(
  token: string,
  approved: boolean,
  writer: typeof saveReport = saveReport,
) {
  const entry = entries.get(token);
  if (!entry || entry.expiresAt <= Date.now()) throw new Error("저장 확인이 만료되었습니다. 다시 조사해주세요.");
  if (entry.state === "saved") return { saved: true, message: "이미 저장된 리포트입니다." };
  if (entry.state === "rejected") return { saved: false, message: "저장을 취소했습니다." };
  if (entry.state !== "pending") throw new Error("이미 처리 중이거나 실패한 요청입니다. 자동 재시도하지 않습니다.");
  if (!approved) {
    entry.state = "rejected";
    console.info("[save_report] n: 저장 취소 (DB 쓰기 없음)");
    return { saved: false, message: "저장을 취소했습니다. DB에 저장하지 않았습니다." };
  }
  // await 전에 상태를 바꿔 이중 클릭·동시 요청에 의한 중복 삽입을 막는다.
  entry.state = "saving";
  console.info("[save_report] y: 사람 확인 완료, DB 저장 시작 (내용 비공개)");
  try {
    const result = await writer({ prompt: "행사 기획 조언 (가상 실습 자료)", ...entry.draft });
    entry.state = "saved";
    console.info("[save_report] DB 저장 완료");
    return result;
  } catch {
    entry.state = "failed";
    console.error("[save_report] DB 저장 실패 (오류 원문 비공개)");
    throw new Error("저장 결과를 확인하지 못했습니다. 중복 저장 방지를 위해 자동 재시도하지 않습니다.");
  }
}
