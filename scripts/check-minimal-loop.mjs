import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";

// Next.js와 같은 서버 모듈을 임시 디렉터리에서 실행한다. 기존 개발 서버와 .env는 변경하지 않는다.
const root = process.cwd();
const scratch = await mkdtemp(path.join(tmpdir(), "agent-loop-"));
try {
  await symlink(path.join(root, "node_modules"), path.join(scratch, "node_modules"), "dir");
  for (const file of ["agent/runAgent", "config/demo", "lib/shared", "tools/definitions", "tools/searchEvents", "tools/getEventDetails", "tools/reportApproval", "tools/saveReport", "lib/supabase", "app/api/agent/confirm/route"]) {
    const source = await readFile(path.join(root, "src", `${file}.ts`), "utf8");
    let output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    output = output.replace(/from "@\/([^\"]+)"/g, (_, name) => `from "${path.join(scratch, name)}.mjs"`);
    const target = path.join(scratch, `${file}.mjs`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, output);
  }
  await writeFile(path.join(scratch, "verify.mjs"), `
    import assert from "node:assert/strict";
    import nextEnv from "@next/env";
    nextEnv.loadEnvConfig(process.cwd(), true, {info(){},error(){}});
    const {runAgent, AgentRunError} = await import("./agent/runAgent.mjs");
    const prompt = "서울에서 대학생 AI 해커톤을 기획하고 있어. 유사 샘플을 찾고 조언해줘.";
    if (process.env.AGENT_MAX_STEPS === "4") {
      const result = await runAgent(prompt);
      assert.equal(result.steps.length, 3);
      assert.equal(result.steps[0].name, "search_events");
      assert.equal(result.steps[1].name, "get_event_details");
      assert.equal(result.steps[2].name, "save_report");
      assert.equal(result.reportSaved, false);
      assert.ok(result.pendingReport?.token);
      assert.ok(result.pendingReport.draft.findings.some(item => item.includes("sample-1")));
      const {confirmReport, prepareReport} = await import("./tools/reportApproval.mjs");
      let writes = 0;
      const writer = async () => { writes++; return {saved:true, message:"테스트 저장"}; };
      // 실제 에이전트의 초안을 n으로 거절: 주입한 쓰기 함수도 호출되지 않아야 한다.
      const declined = await confirmReport(result.pendingReport.token, false, writer);
      assert.equal(declined.saved, false);
      assert.equal(writes, 0);
      assert.equal((await confirmReport(result.pendingReport.token, true, writer)).saved, false);
      assert.equal(writes, 0);
      // 승인은 가짜 저장 함수로만 검증한다. 실제 DB에는 쓰지 않는다.
      const approved = prepareReport(result.pendingReport.draft);
      assert.equal((await confirmReport(approved.token, true, writer)).saved, true);
      await confirmReport(approved.token, true, writer);
      assert.equal(writes, 1);
      await assert.rejects(() => confirmReport("invalid-token", true, writer));
      let release;
      const barrier = new Promise(resolve => {release=resolve;});
      const concurrent = prepareReport(result.pendingReport.draft);
      const first = confirmReport(concurrent.token, true, async () => {await barrier; return {saved:true,message:"테스트"};});
      await assert.rejects(() => confirmReport(concurrent.token, true, writer));
      release(); await first;
      const failed = prepareReport(result.pendingReport.draft);
      await assert.rejects(() => confirmReport(failed.token, true, async () => {throw new Error("테스트 오류");}));
      await assert.rejects(() => confirmReport(failed.token, true, writer));
      const expired = prepareReport(result.pendingReport.draft);
      const clock = Date.now;
      try {
        Date.now = () => expired.expiresAt + 1;
        await assert.rejects(() => confirmReport(expired.token, true, writer));
      } finally { Date.now = clock; }
      assert.equal(writes, 1);
      const {POST} = await import("./app/api/agent/confirm/route.mjs");
      const request = (body, origin="http://localhost") => new Request("http://localhost/api/agent/confirm", {method:"POST", headers:{"Content-Type":"application/json", origin}, body:JSON.stringify(body)});
      assert.equal((await POST(request({token:approved.token,approved:"y"}))).status,400);
      assert.equal((await POST(request({token:approved.token,approved:true},"http://other.test"))).status,403);
      const viaApi = prepareReport(result.pendingReport.draft);
      const declinedResponse = await POST(request({token:viaApi.token,approved:false}));
      assert.equal(declinedResponse.status,200);
      assert.equal((await declinedResponse.json()).saved,false);
      assert.equal(writes,1);
      console.log("PASS 저장 확인: n 쓰기 0회, y·재전송 쓰기 1회(가짜 함수), 동시 실행·위조·실패 재시도·만료·다른 출처 차단");
      assert.match(result.reply, /가상/);
      assert.match(result.reply, /sample-1/);
      console.log("PASS max_steps=4: 도구 결과를 반영한 최종 답변과 출처, 저장 없음");
    } else {
      await assert.rejects(() => runAgent(prompt), error => {
        assert.ok(error instanceof AgentRunError);
        assert.match(error.message, /최대 1회/);
        assert.equal(error.steps.length, 1);
        return true;
      });
      console.log("PASS max_steps=1: 도구 1회 실행 후 최대 단계에서 종료");
    }
  `);
  for (const limit of ["4", "1"]) {
    const result = spawnSync(process.execPath, ["--conditions=react-server", path.join(scratch, "verify.mjs")], {
      cwd: root, env: { ...process.env, AGENT_MAX_STEPS: limit }, stdio: "inherit", timeout: 120000,
    });
    assert.equal(result.status, 0, `max_steps=${limit} 검사 실패`);
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
