import { confirmReport } from "@/tools/reportApproval";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // 다른 사이트가 브라우저를 이용해 확인 요청을 보내는 것을 차단한다.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "허용되지 않은 요청입니다." }, { status: 403 });
  }
  let body: unknown;
  try { body = await request.json(); } catch {
    return Response.json({ error: "요청 형식을 확인해주세요." }, { status: 400 });
  }
  const { token, approved } = (body && typeof body === "object" ? body : {}) as { token?: unknown; approved?: unknown };
  if (typeof token !== "string" || !/^[0-9a-f-]{36}$/.test(token) || typeof approved !== "boolean") {
    return Response.json({ error: "확인 토큰과 y/n 선택이 필요합니다." }, { status: 400 });
  }
  try {
    return Response.json(await confirmReport(token, approved));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "확인 처리에 실패했습니다." }, { status: 409 });
  }
}
