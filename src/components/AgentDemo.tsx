"use client";

import { useState, type FormEvent } from "react";
import { DEMO_PROMPT, MAX_PROMPT_LENGTH, MAX_STEPS } from "@/lib/shared";
import type { AgentRunResult, AgentStep } from "@/lib/types";

type RunState = "idle" | "running" | "done" | "error";

export default function AgentDemo() {
  const [prompt, setPrompt] = useState(DEMO_PROMPT);
  const [state, setState] = useState<RunState>("idle");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [reportSaved, setReportSaved] = useState(false);

  async function run(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "running" || !prompt.trim()) return;
    setState("running");
    setSteps([]);
    setReply("");
    setError("");
    setReportSaved(false);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = (await response.json()) as Partial<AgentRunResult> & {
        error?: string;
      };
      setSteps(data.steps ?? []);
      if (!response.ok)
        throw new Error(data.error || "에이전트를 실행하지 못했습니다.");
      if (typeof data.reply !== "string")
        throw new Error("에이전트 응답이 비어 있습니다.");
      setReply(data.reply);
      setReportSaved(Boolean(data.reportSaved));
      setState("done");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "연결 오류가 발생했습니다.",
      );
      setState("error");
    }
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <span className="session-tag">
          SESSION 09 <b>·</b> AGENT
        </span>
      </header>

      <section className="hero" id="top">
        <h1>
          목표를 주면,
          <br />
          <em>도구를 골라 실행하는</em> 에이전트
        </h1>
        <p className="lede">
          AI가 도구를 고르면, 개발자는 코드를 실행하고 AI에 결과를 전송하는
          과정을 반복합니다.
          <br className="desktop-break" /> 행사 샘플 검색 도구 하나로
          조사 결과와 조언을 확인해 보세요.
        </p>
      </section>

      <section className="demo-grid" aria-label="에이전트 실행 데모">
        <div className="run-card">
          <div className="card-heading">
            <div>
              <h2>예제: 행사 레퍼런스 찾기</h2>
            </div>
            <span className="step-limit">
              MAX_STEPS <b>{MAX_STEPS}</b>
            </span>
          </div>
          <form onSubmit={run}>
            <label htmlFor="prompt">에이전트에 목표를 입력하세요</label>
            <textarea
              id="prompt"
              value={prompt}
              maxLength={MAX_PROMPT_LENGTH}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              disabled={state === "running"}
            />
            <div className="form-foot">
              <span>
                {prompt.length} / {MAX_PROMPT_LENGTH}
              </span>
              <button
                type="submit"
                disabled={state === "running" || !prompt.trim()}
              >
                {state === "running" ? (
                  <>
                    <span className="spinner" /> 실행 중
                  </>
                ) : (
                  <>
                    에이전트 실행 <span aria-hidden="true">↗</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <aside className="trace-card" aria-live="polite">
          <div className="trace-heading">
            <div>
              <h2>실행 로그</h2>
            </div>
            <span className={`run-status ${state}`}>
              <i />
              {state === "running"
                ? "RUNNING"
                : state === "done"
                  ? "COMPLETE"
                  : state === "error"
                    ? "FAILED"
                    : "READY"}
            </span>
          </div>
          <div className="trace-list">
            {steps.length === 0 && state !== "running" && (
              <div className="trace-empty">
                <span className="empty-orbit">◎</span>
                <p>
                  실행하면 도구 선택과
                  <br />
                  결과가 여기에 표시됩니다.
                </p>
              </div>
            )}
            {state === "running" && steps.length === 0 && (
              <div className="trace-empty">
                <span className="empty-orbit pulse">◎</span>
                <p>
                  목표를 읽고 행동을
                  <br />
                  고르고 있어요…
                </p>
              </div>
            )}
            {steps.map((step, index) => (
              <article
                className={`trace-step ${step.status}`}
                key={`${step.name}-${index}`}
              >
                <div className="trace-index">
                  {String(index).padStart(2, "0")}
                </div>
                <div className="trace-content">
                  <div className="trace-title">
                    <strong>{step.name}</strong>
                    <span>{step.status === "done" ? "DONE" : "ERROR"}</span>
                  </div>
                  <p>{step.output}</p>
                  <small>입력 · {step.input}</small>
                </div>
              </article>
            ))}
            {state === "running" && steps.length > 0 && (
              <div className="trace-wait">
                <span className="spinner dark" /> 다음 도구를 기다리는 중
              </div>
            )}
          </div>
          {error && (
            <div className="error-box" role="alert">
              <strong>실행이 멈췄어요</strong>
              <p>{error}</p>
              <small>
                최대 단계 제한과 OpenAI 환경 설정을 확인해 주세요.
              </small>
            </div>
          )}
          {reply && (
            <div className="result-box">
              <div className="result-title">
                <span>에이전트 결과</span>
                {reportSaved && (
                  <b>
                    <i /> Supabase 저장 완료
                  </b>
                )}
              </div>
              <p>{reply}</p>
            </div>
          )}
        </aside>
      </section>

      <footer></footer>
    </main>
  );
}
