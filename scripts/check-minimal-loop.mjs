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
  for (const file of ["agent/runAgent", "config/demo", "lib/shared", "tools/definitions", "tools/searchEvents"]) {
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
    if (process.env.AGENT_MAX_STEPS === "2") {
      const result = await runAgent(prompt);
      assert.equal(result.steps.length, 1);
      assert.equal(result.steps[0].name, "search_events");
      assert.equal(result.reportSaved, false);
      assert.match(result.reply, /가상/);
      assert.match(result.reply, /sample-1/);
      console.log("PASS max_steps=2: 도구 결과를 반영한 최종 답변과 출처, 저장 없음");
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
  for (const limit of ["2", "1"]) {
    const result = spawnSync(process.execPath, ["--conditions=react-server", path.join(scratch, "verify.mjs")], {
      cwd: root, env: { ...process.env, AGENT_MAX_STEPS: limit }, stdio: "inherit", timeout: 120000,
    });
    assert.equal(result.status, 0, `max_steps=${limit} 검사 실패`);
  }
} finally {
  await rm(scratch, { recursive: true, force: true });
}
