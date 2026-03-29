"use client";

import { useState } from "react";
import { Player } from "@remotion/player";
import {
  DEMO_PROMPTS,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "@/lib/constants";
import { defaultAgentEVideoProps } from "@/lib/template-engine";
import { AgentEVideoProps, VideoSpec } from "@/lib/video-spec";
import { AgentEVideo } from "@/remotion/AgentEVideo";

type GenerateResponse = {
  source: "deepseek" | "fallback";
  model: string;
  warning: string | null;
  spec: VideoSpec;
  videoProps: AgentEVideoProps;
};

type RenderResponse = {
  renderId: string;
  downloadUrl: string;
  outputPath: string;
  logPath: string;
};

const sourceLabel = (source: "deepseek" | "fallback") => {
  return source === "deepseek" ? "DeepSeek" : "Fallback";
};

export const MvpStudio = () => {
  const [prompt, setPrompt] = useState(DEMO_PROMPTS[0]);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderResult, setRenderResult] = useState<RenderResponse | null>(null);

  const previewProps = result?.videoProps ?? defaultAgentEVideoProps;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setRenderResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json()) as GenerateResponse | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Generate request failed.");
      }

      setResult(data as GenerateResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to generate video spec.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRender = async () => {
    setIsRendering(true);
    setError(null);

    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoProps: previewProps }),
      });

      const data = (await response.json()) as RenderResponse | { error: string };

      if (!response.ok) {
        throw new Error("error" in data ? data.error : "Render request failed.");
      }

      setRenderResult(data as RenderResponse);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to render video.",
      );
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,244,214,0.78),_transparent_28%),radial-gradient(circle_at_right_18%,_rgba(14,116,144,0.12),_transparent_22%),linear-gradient(180deg,_#f7f2ea_0%,_#fbfaf8_100%)]">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-16 px-6 py-8 lg:px-10 lg:py-12 xl:px-14">
        <section className="grid gap-12 lg:grid-cols-[22rem_minmax(0,1fr)] xl:gap-20">
          <aside className="rounded-[28px] border border-black/5 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-800">
                  agentE MVP
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.05em] text-slate-900">
                  输入一句话，生成可预览的视频草稿
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  当前只做模板化产品介绍视频。先打通 DeepSeek 到 MP4 的主链，再扩展自由度。
                </p>
              </div>

              <label className="block space-y-3">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Prompt
                </span>
                <textarea
                  data-testid="prompt-input"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  rows={10}
                  className="min-h-60 w-full resize-y rounded-[24px] border border-black/8 bg-stone-50 px-4 py-4 text-base leading-7 text-slate-900 outline-none transition focus:border-teal-700 focus:bg-white"
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  data-testid="generate-button"
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {isGenerating ? "生成中..." : "生成 VideoSpec"}
                </button>
                <button
                  type="button"
                  onClick={handleRender}
                  disabled={isRendering}
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-black/20 hover:bg-stone-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {isRendering ? "导出中..." : "导出 MP4"}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  示例 prompt
                </p>
                <div className="space-y-2">
                  {DEMO_PROMPTS.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setPrompt(example)}
                      className="w-full rounded-2xl border border-black/6 bg-white/70 px-4 py-3 text-left text-sm leading-6 text-slate-700 transition hover:border-black/12 hover:bg-white"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {result ? (
                <div className="rounded-[24px] border border-black/6 bg-stone-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      当前来源
                    </p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                      {sourceLabel(result.source)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    model: {result.model}
                  </p>
                  {result.warning ? (
                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      {result.warning}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-teal-700">
                      DeepSeek 返回成功，当前预览已使用真实模型结果。
                    </p>
                  )}
                </div>
              ) : null}

              {renderResult ? (
                <div className="rounded-[24px] border border-teal-900/10 bg-teal-950/[0.03] px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Render 完成
                  </p>
                  <p className="mt-3 break-all font-mono text-xs leading-6 text-slate-600">
                    {renderResult.outputPath}
                  </p>
                  <a
                    href={renderResult.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-full bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    下载 MP4
                  </a>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-[24px] border border-amber-600/15 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                  {error}
                </div>
              ) : null}
            </div>
          </aside>

          <section className="flex flex-col gap-10 xl:gap-14">
            <header className="max-w-3xl space-y-6 pb-2 pt-4 lg:pt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {"Prompt -> DeepSeek -> VideoSpec -> MP4"}
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold leading-none tracking-[-0.08em] text-slate-950 sm:text-6xl xl:text-7xl">
                简洁地看见生成流程，而不是被界面淹没。
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                页面只保留输入、预览、导出三件事。大面积留白让状态更清楚，也方便你后续继续加素材、字幕或浏览器捕获。
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                {["模板优先", "16:9", "60fps", "DeepSeek", "Remotion"].map(
                  (item) => (
                    <span
                      key={item}
                      className="rounded-full border border-black/6 bg-white/70 px-3 py-1.5"
                    >
                      {item}
                    </span>
                  ),
                )}
              </div>
            </header>

            <div className="rounded-[32px] border border-black/6 bg-white/70 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 xl:p-8">
              <div className="mx-auto max-w-[920px]">
                <Player
                  component={AgentEVideo}
                  inputProps={previewProps}
                  durationInFrames={previewProps.durationSec * VIDEO_FPS}
                  compositionWidth={VIDEO_WIDTH}
                  compositionHeight={VIDEO_HEIGHT}
                  fps={VIDEO_FPS}
                  controls
                  autoPlay={false}
                  loop
                  acknowledgeRemotionLicense
                  style={{
                    width: "100%",
                    aspectRatio: `${VIDEO_WIDTH} / ${VIDEO_HEIGHT}`,
                    borderRadius: 28,
                    overflow: "hidden",
                    background: "#020617",
                  }}
                />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
              <div className="rounded-[28px] border border-black/6 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  当前视频
                </p>
                <div className="mt-5 space-y-4">
                  <h2 className="text-3xl font-semibold tracking-[-0.06em] text-slate-950">
                    {previewProps.productName}
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-slate-600">
                    {previewProps.tagline}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      previewProps.brandTone,
                      previewProps.language,
                      `${previewProps.durationSec}s`,
                      previewProps.targetAudience,
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-black/6 bg-stone-50 px-3 py-1.5 text-sm text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/6 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Scene Outline
                </p>
                <div className="mt-5 space-y-5">
                  {previewProps.scenes.map((scene, index) => (
                    <div
                      key={`${scene.kind}-${index}`}
                      className="rounded-[22px] border border-black/6 bg-stone-50 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-800">
                          {scene.kind}
                        </span>
                        <span className="text-xs text-slate-400">
                          {scene.eyebrow}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-slate-900">
                        {scene.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {scene.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
};
