"use client";

import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

type WorkflowStage = {
  id: "generate" | "preview" | "export";
  step: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  supporting: string;
};

const WORKFLOW_STAGES: WorkflowStage[] = [
  {
    id: "generate",
    step: "01",
    label: "Generate",
    eyebrow: "CORE VALUE",
    title: "先把 MVP 主链跑通",
    body: "当前版本优先解决生成、预览、导出三件事，不在任意 TSX 代码执行上冒险。",
    bullets: ["Prompt -> DeepSeek", "Schema 校验", "模板化编译"],
    supporting:
      "第一段滚动先点亮结构化路径，用户能立刻理解为什么这条链路稳定。",
  },
  {
    id: "preview",
    step: "02",
    label: "Preview",
    eyebrow: "LIVE PREVIEW",
    title: "让预览像一个正在工作的控制台",
    body: "右侧 sticky 预览会跟着滚动逐步抬升，scene、语气、时长和来源状态被同步确认。",
    bullets: ["播放器 sticky", "状态面板同步", "Scene Outline 联动"],
    supporting:
      "Wow 点不在于动得多，而在于每次滚动都能明确带来一个新的确认结果。",
  },
  {
    id: "export",
    step: "03",
    label: "Export",
    eyebrow: "DELIVER",
    title: "导出是同一条轨道上的自然收束",
    body: "最后一步只聚焦交付：Render、下载链接和日志路径。结果出现时像流程完成，而不是跳到另一个页面。",
    bullets: ["本地 MP4", "下载链接", "渲染日志"],
    supporting:
      "保持视觉连续性，让用户把成片交付理解成一次自然落点，而不是额外操作。",
  },
];

const SHORTCUTS = [
  "Ctrl/Cmd + Enter 生成",
  "Shift + R 重播入场",
  "/ 聚焦 Prompt",
];

const rootStyle = {
  "--tilt-x": "0deg",
  "--tilt-y": "0deg",
  "--surface-lift": "0px",
  "--glow-x": "50%",
  "--glow-y": "18%",
} as CSSProperties;

const cn = (...parts: Array<string | false | null | undefined>) => {
  return parts.filter(Boolean).join(" ");
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
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [revealSeed, setRevealSeed] = useState(0);
  const [interactionLabel, setInteractionLabel] = useState("滚动以唤醒主链路");

  const previewProps = result?.videoProps ?? defaultAgentEVideoProps;
  const activeStage = WORKFLOW_STAGES[activeStageIndex] ?? WORKFLOW_STAGES[0];

  const rootRef = useRef<HTMLElement | null>(null);
  const storyRef = useRef<HTMLElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const stageRefs = useRef<Array<HTMLElement | null>>([]);
  const pointerFrameRef = useRef<number | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const generateActionRef = useRef<() => Promise<void>>(async () => {});
  const replayActionRef = useRef<() => void>(() => {});

  const markInteraction = (label: string) => {
    setInteractionLabel((previous) => {
      return previous === label ? previous : label;
    });
  };

  const handleGenerate = async () => {
    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setRenderResult(null);
    markInteraction("点击生成：正在规划 VideoSpec");

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

      startTransition(() => {
        setResult(data as GenerateResponse);
        setActiveStageIndex(1);
      });

      markInteraction("生成完成：预览已接管");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to generate video spec.",
      );
      markInteraction("生成失败：请检查输入或服务状态");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRender = async () => {
    if (isRendering) {
      return;
    }

    setIsRendering(true);
    setError(null);
    markInteraction("点击导出：正在渲染 MP4");

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

      startTransition(() => {
        setRenderResult(data as RenderResponse);
        setActiveStageIndex(2);
      });

      markInteraction("导出完成：成片已可下载");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to render video.",
      );
      markInteraction("导出失败：请查看日志和错误提示");
    } finally {
      setIsRendering(false);
    }
  };

  const replayAnimations = () => {
    setRevealSeed((value) => value + 1);
    markInteraction("刷新完成：元素已渐进重放");
  };

  generateActionRef.current = handleGenerate;
  replayActionRef.current = replayAnimations;

  useEffect(() => {
    const updateScrollState = () => {
      const storyNode = storyRef.current;

      if (!storyNode) {
        return;
      }

      const rect = storyNode.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const totalTravel = Math.max(rect.height - viewportHeight, 1);
      const progress = Math.min(Math.max(-rect.top / totalTravel, 0), 1);

      setStoryProgress((previous) => {
        return Math.abs(previous - progress) > 0.01 ? progress : previous;
      });

      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      stageRefs.current.forEach((node, index) => {
        if (!node) {
          return;
        }

        const nodeRect = node.getBoundingClientRect();
        const center = nodeRect.top + nodeRect.height / 2;
        const distance = Math.abs(viewportHeight * 0.46 - center);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      setActiveStageIndex((previous) => {
        return previous === nearestIndex ? previous : nearestIndex;
      });
    };

    const schedule = () => {
      if (scrollFrameRef.current !== null) {
        return;
      }

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        updateScrollState();
      });
    };

    updateScrollState();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);

      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isTextInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void generateActionRef.current();
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        replayActionRef.current();
        return;
      }

      if (event.key === "/" && !isTextInput) {
        event.preventDefault();
        promptRef.current?.focus();
        markInteraction("键盘聚焦：Prompt 已就绪");
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pointerFrameRef.current !== null) {
        window.cancelAnimationFrame(pointerFrameRef.current);
      }
    };
  }, []);

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const node = rootRef.current;

    if (!node) {
      return;
    }

    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const applyPointerStyle = () => {
      pointerFrameRef.current = null;
      node.style.setProperty("--tilt-x", `${((0.5 - y) * 7).toFixed(2)}deg`);
      node.style.setProperty("--tilt-y", `${((x - 0.5) * 10).toFixed(2)}deg`);
      node.style.setProperty("--surface-lift", `${((0.45 - y) * 10).toFixed(2)}px`);
      node.style.setProperty("--glow-x", `${(x * 100).toFixed(2)}%`);
      node.style.setProperty("--glow-y", `${(y * 100).toFixed(2)}%`);
    };

    if (pointerFrameRef.current !== null) {
      window.cancelAnimationFrame(pointerFrameRef.current);
    }

    pointerFrameRef.current = window.requestAnimationFrame(applyPointerStyle);
  };

  const handlePointerLeave = () => {
    const node = rootRef.current;

    if (!node) {
      return;
    }

    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
    node.style.setProperty("--surface-lift", "0px");
    node.style.setProperty("--glow-x", "50%");
    node.style.setProperty("--glow-y", "18%");
  };

  const progressWidth = `${Math.max(storyProgress * 100, 8)}%`;
  const heroMetrics = [
    {
      label: "当前主链阶段",
      value: `${activeStage.step} ${activeStage.label}`,
    },
    {
      label: "滚动唤醒进度",
      value: `${Math.round(storyProgress * 100)}%`,
    },
    {
      label: "当前视频时长",
      value: `${previewProps.durationSec}s`,
    },
    {
      label: "状态源",
      value: result ? sourceLabel(result.source) : "Default Template",
    },
  ];

  return (
    <main
      ref={rootRef}
      style={rootStyle}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onWheelCapture={() => markInteraction("滚轮移动：流程正在被点亮")}
      className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,_#f8f4ed_0%,_#f7f8f6_46%,_#eef5f3_100%)] text-slate-950"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="floating-orb absolute left-[-10%] top-[-4%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.9)_0%,_rgba(195,255,242,0.3)_48%,_transparent_72%)] blur-3xl" />
        <div className="floating-orb absolute right-[-8%] top-[16%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(174,220,255,0.24)_0%,_rgba(255,255,255,0.04)_62%,_transparent_74%)] blur-3xl [animation-delay:2s]" />
        <div className="floating-orb absolute bottom-[-14%] left-[28%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(232,255,181,0.28)_0%,_transparent_68%)] blur-3xl [animation-delay:4s]" />
        <div className="slow-grid absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-[1600px] px-6 py-4 lg:px-10 xl:px-14">
        <header className="sticky top-4 z-40 mb-8">
          <div className="glass-panel interactive-ring flex flex-col gap-4 rounded-[28px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(15,23,42,0.18)]">
                AE
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                  agentE MVP
                </p>
                <p className="text-sm text-slate-600">
                  滚动不是装饰，它是这条工作流的时间轴。
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                {SHORTCUTS.map((shortcut) => (
                  <span
                    key={shortcut}
                    className="rounded-full border border-black/6 bg-white/65 px-3 py-1.5 tracking-[0.02em]"
                  >
                    {shortcut}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div
                  aria-live="polite"
                  className="rounded-full border border-teal-900/10 bg-teal-950/[0.04] px-3 py-1.5 text-xs font-semibold tracking-[0.14em] text-teal-900"
                >
                  {interactionLabel}
                </div>
                <button
                  data-testid="refresh-button"
                  type="button"
                  onClick={replayAnimations}
                  className="rounded-full border border-black/8 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-900 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white active:scale-[0.98]"
                >
                  Refresh 渐进出现
                </button>
              </div>
            </div>
          </div>
        </header>

        <section
          key={`hero-${revealSeed}`}
          className="grid min-h-[78vh] gap-12 pb-14 pt-6 lg:grid-cols-[minmax(0,0.58fr)_minmax(320px,0.42fr)] lg:items-end"
        >
          <div className="space-y-8 lg:pb-16">
            <p
              className="reveal-up text-xs font-semibold uppercase tracking-[0.34em] text-slate-500"
              style={{ animationDelay: "40ms" }}
            >
              {"Prompt -> DeepSeek -> VideoSpec -> MP4"}
            </p>
            <h1
              className="reveal-up max-w-5xl text-5xl font-semibold leading-[0.92] tracking-[-0.08em] text-slate-950 sm:text-6xl xl:text-7xl"
              style={{ animationDelay: "120ms" }}
            >
              简洁地看见生成流程，而不是被界面淹没。
            </h1>
            <p
              className="reveal-up max-w-2xl text-lg leading-8 text-slate-600"
              style={{ animationDelay: "220ms" }}
            >
              这版首页把滚动变成工作流时间轴。用户滚一下，就能亲眼看到
              `生成 / 预览 / 导出` 被逐段唤醒，视觉上始终围绕一个核心焦点工作。
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                "60% 留白",
                "毛玻璃背景",
                "Scroll-linked",
                "Hover + Click",
                "Keyboard Ready",
              ].map((item, index) => (
                <span
                  key={item}
                  className="reveal-up rounded-full border border-black/6 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700"
                  style={{ animationDelay: `${300 + index * 70}ms` }}
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroMetrics.map((item, index) => (
                <div
                  key={item.label}
                  className="glass-panel reveal-up rounded-[26px] px-5 py-5"
                  style={{ animationDelay: `${420 + index * 80}ms` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-4 text-xl font-semibold tracking-[-0.05em] text-slate-950">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal-up lg:justify-self-end" style={{ animationDelay: "280ms" }}>
            <div className="glass-panel interactive-ring tilt-surface relative max-w-[430px] rounded-[38px] p-6 sm:p-7">
              <div className="absolute inset-0 rounded-[38px] bg-[radial-gradient(circle_at_var(--glow-x)_var(--glow-y),_rgba(126,249,235,0.2),_transparent_36%)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-900">
                    {activeStage.eyebrow}
                  </p>
                  <span className="rounded-full border border-black/6 bg-white/75 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-slate-600">
                    {activeStage.step}
                  </span>
                </div>
                <h2 className="mt-6 text-3xl font-semibold leading-tight tracking-[-0.06em] text-slate-950">
                  先把 MVP 主链跑通
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  当前版本优先解决生成、预览、导出三件事，不在任意 TSX 代码执行上冒险。
                </p>
                <div className="mt-8 h-2 rounded-full bg-black/6">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,_#0f172a_0%,_#14b8a6_56%,_#bef264_100%)] transition-[width] duration-500"
                    style={{ width: progressWidth }}
                  />
                </div>
                <div className="mt-7 space-y-3">
                  {WORKFLOW_STAGES.map((stage, index) => {
                    const isActive = index === activeStageIndex;

                    return (
                      <div
                        key={stage.id}
                        className={cn(
                          "rounded-[22px] border px-4 py-4 transition duration-500",
                          isActive
                            ? "border-teal-900/12 bg-white/78 shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
                            : "border-black/5 bg-white/46",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            {stage.label}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {stage.step}
                          </span>
                        </div>
                        <p className="mt-3 text-base font-semibold tracking-[-0.04em] text-slate-950">
                          {stage.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={storyRef}
          key={`story-${revealSeed}`}
          className="grid gap-10 pb-24 lg:grid-cols-[minmax(0,0.44fr)_minmax(0,0.56fr)]"
        >
          <div className="relative">
            <div className="absolute bottom-24 left-[18px] top-8 hidden w-px bg-black/8 lg:block">
              <div
                className="w-full rounded-full bg-[linear-gradient(180deg,_#0f172a_0%,_#14b8a6_62%,_#bef264_100%)] transition-[height] duration-500"
                style={{ height: progressWidth }}
              />
            </div>
            <div className="space-y-20">
              {WORKFLOW_STAGES.map((stage, index) => {
                const isActive = index === activeStageIndex;

                return (
                  <article
                    key={stage.id}
                    ref={(node) => {
                      stageRefs.current[index] = node;
                    }}
                    className="relative min-h-[72vh] lg:pl-14"
                  >
                    <div className="absolute left-0 top-8 hidden lg:flex h-9 w-9 items-center justify-center rounded-full border border-black/8 bg-white/80 text-xs font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                      {stage.step}
                    </div>
                    <div
                      className={cn(
                        "glass-panel interactive-ring group rounded-[34px] p-6 transition duration-500 md:p-8",
                        isActive
                          ? "translate-y-0 scale-[1.01] border-black/10 shadow-[0_26px_80px_rgba(15,23,42,0.09)]"
                          : "translate-y-2 opacity-70 hover:-translate-y-1 hover:opacity-100",
                      )}
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="max-w-2xl space-y-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-900">
                            {stage.eyebrow}
                          </p>
                          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.06em] text-slate-950">
                            {stage.title}
                          </h2>
                          <p className="text-base leading-7 text-slate-600">
                            {stage.body}
                          </p>
                        </div>
                        <span className="w-fit rounded-full border border-black/6 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                          {stage.label}
                        </span>
                      </div>

                      <div className="mt-8 grid gap-3 sm:grid-cols-3">
                        {stage.bullets.map((bullet) => (
                          <div
                            key={bullet}
                            className="rounded-[22px] border border-black/6 bg-white/72 px-4 py-4 text-sm font-medium leading-6 text-slate-700 transition duration-300 group-hover:scale-[1.01]"
                          >
                            {bullet}
                          </div>
                        ))}
                      </div>

                      <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-500">
                        {stage.supporting}
                      </p>

                      {stage.id === "generate" ? (
                        <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,0.68fr)_minmax(0,0.32fr)]">
                          <div className="space-y-4">
                            <label className="block space-y-3">
                              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                Prompt
                              </span>
                              <textarea
                                ref={promptRef}
                                data-testid="prompt-input"
                                value={prompt}
                                onChange={(event) => setPrompt(event.target.value)}
                                rows={10}
                                className="min-h-64 w-full resize-y rounded-[28px] border border-black/8 bg-white/80 px-5 py-5 text-base leading-7 text-slate-900 outline-none transition duration-300 focus:border-teal-700 focus:bg-white focus:shadow-[0_0_0_6px_rgba(20,184,166,0.12)]"
                              />
                            </label>

                            <div className="flex flex-wrap gap-3">
                              <button
                                data-testid="generate-button"
                                type="button"
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                              >
                                {isGenerating ? "生成中..." : "生成 VideoSpec"}
                              </button>
                              <button
                                type="button"
                                onClick={replayAnimations}
                                className="rounded-full border border-black/8 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-900 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white active:scale-[0.98]"
                              >
                                重播入场
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              示例 prompt
                            </p>
                            {DEMO_PROMPTS.map((example) => (
                              <button
                                key={example}
                                type="button"
                                onClick={() => {
                                  setPrompt(example);
                                  markInteraction("点击示例：Prompt 已替换");
                                }}
                                className="w-full rounded-[24px] border border-black/6 bg-white/72 px-4 py-4 text-left text-sm leading-6 text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-black/10 hover:bg-white active:scale-[0.99]"
                              >
                                {example}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {stage.id === "generate" && result ? (
                        <div className="mt-6 rounded-[26px] border border-black/6 bg-white/78 px-5 py-5">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">
                              当前来源
                            </p>
                            <span className="rounded-full border border-black/6 bg-stone-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                              {sourceLabel(result.source)}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-slate-600">
                            model: {result.model}
                          </p>
                          <p
                            className={cn(
                              "mt-3 text-sm leading-6",
                              result.warning ? "text-amber-700" : "text-teal-700",
                            )}
                          >
                            {result.warning ??
                              "DeepSeek 返回成功，结构化 spec 已接入真实预览。"}
                          </p>
                        </div>
                      ) : null}

                      {stage.id === "preview" ? (
                        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)]">
                          <div className="rounded-[26px] border border-black/6 bg-white/76 px-5 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              当前视频
                            </p>
                            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                              {previewProps.productName}
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {previewProps.tagline}
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
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
                          <div className="rounded-[26px] border border-black/6 bg-white/76 px-5 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              当前 scene
                            </p>
                            <div className="mt-4 space-y-3">
                              {previewProps.scenes.slice(0, 3).map((scene, sceneIndex) => (
                                <div
                                  key={`${scene.kind}-${sceneIndex}`}
                                  className="rounded-[20px] border border-black/6 bg-stone-50 px-4 py-4"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-900">
                                      {scene.kind}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {scene.eyebrow}
                                    </span>
                                  </div>
                                  <p className="mt-3 text-sm font-semibold text-slate-900">
                                    {scene.title}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {stage.id === "export" ? (
                        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)]">
                          <div className="rounded-[26px] border border-black/6 bg-white/76 px-5 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              导出动作
                            </p>
                            <button
                              type="button"
                              onClick={handleRender}
                              disabled={isRendering}
                              className="mt-4 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                            >
                              {isRendering ? "导出中..." : "导出 MP4 成片"}
                            </button>
                            <p className="mt-4 text-sm leading-6 text-slate-600">
                              渲染、下载和日志都留在同一块面板里，保持交付动作的连续性。
                            </p>
                          </div>

                          <div className="rounded-[26px] border border-black/6 bg-white/76 px-5 py-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              渲染结果
                            </p>
                            {renderResult ? (
                              <div className="mt-4 space-y-4">
                                <p className="text-sm font-semibold text-slate-900">
                                  Render 完成
                                </p>
                                <p className="break-all font-mono text-xs leading-6 text-slate-600">
                                  {renderResult.outputPath}
                                </p>
                                <a
                                  href={renderResult.downloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex rounded-full border border-teal-900/10 bg-teal-950 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-teal-900"
                                >
                                  下载 MP4
                                </a>
                              </div>
                            ) : (
                              <p className="mt-4 text-sm leading-6 text-slate-600">
                                还没有成片输出，右侧预览和这里的导出状态会在渲染完成后一起更新。
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {error ? (
                        <div className="mt-6 rounded-[24px] border border-amber-600/15 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-800">
                          {error}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
            <div className="glass-panel interactive-ring tilt-surface flex h-full flex-col gap-5 rounded-[36px] p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Sticky Preview
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                    右侧预览跟着滚动同步工作
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="rounded-full border border-black/8 bg-white/82 px-4 py-2 text-sm font-semibold text-slate-900 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-white active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                  >
                    {isGenerating ? "生成中..." : "生成当前预览"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRender}
                    disabled={isRendering}
                    className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-slate-800 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                  >
                    {isRendering ? "导出中..." : "导出当前 MP4"}
                  </button>
                </div>
              </div>
              <div className="rounded-[24px] border border-black/6 bg-white/76 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {WORKFLOW_STAGES.map((stage, index) => {
                      const isActive = index === activeStageIndex;

                      return (
                        <div
                          key={stage.id}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition duration-500",
                            isActive
                              ? "border-teal-900/12 bg-teal-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.16)]"
                              : "border-black/6 bg-stone-50 text-slate-600",
                          )}
                        >
                          {stage.label}
                        </div>
                      );
                    })}
                  </div>
                  <span className="rounded-full border border-black/6 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600">
                    {Math.round(storyProgress * 100)}% Scroll-linked
                  </span>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-black/6">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,_#0f172a_0%,_#14b8a6_62%,_#bef264_100%)] transition-[width] duration-500"
                    style={{ width: progressWidth }}
                  />
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[30px] border border-black/6 bg-slate-950/90 p-3 shadow-[0_28px_80px_rgba(2,6,23,0.18)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,_rgba(126,249,235,0.2),_transparent_24%),radial-gradient(circle_at_86%_18%,_rgba(190,242,100,0.14),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.02),_rgba(255,255,255,0.02))]" />
                <div className="relative">
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
                      borderRadius: 24,
                      overflow: "hidden",
                      background: "#020617",
                    }}
                  />
                </div>
              </div>

              <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,0.56fr)_minmax(0,0.44fr)]">
                <div className="rounded-[28px] border border-black/6 bg-white/76 px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Active Stage
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
                    {activeStage.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {activeStage.body}
                  </p>
                  <div className="mt-5 space-y-3">
                    {activeStage.bullets.map((bullet, index) => (
                      <div
                        key={bullet}
                        className="flex items-center gap-3 rounded-[20px] border border-black/6 bg-stone-50 px-4 py-3 text-sm font-medium text-slate-700"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                        {bullet}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-black/6 bg-white/76 px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Runtime Status
                  </p>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-[20px] border border-black/6 bg-stone-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        来源
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {result ? sourceLabel(result.source) : "Default Template"}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-black/6 bg-stone-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        渲染状态
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {isRendering
                          ? "Rendering..."
                          : renderResult
                            ? "MP4 Ready"
                            : "Waiting"}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-black/6 bg-stone-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Scene Outline
                      </p>
                      <div className="mt-3 space-y-2">
                        {previewProps.scenes.map((scene, index) => (
                          <div
                            key={`${scene.kind}-${index}`}
                            className="flex items-center justify-between gap-3 text-sm text-slate-700"
                          >
                            <span className="font-medium">{scene.title}</span>
                            <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
                              {scene.kind}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {renderResult ? (
                      <a
                        href={renderResult.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit rounded-full bg-teal-950 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-teal-900"
                      >
                        打开已导出视频
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};
