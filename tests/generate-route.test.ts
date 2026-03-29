// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/generate/route";

vi.mock("@/lib/deepseek", () => ({
  generateVideoSpec: vi.fn(),
}));

import { generateVideoSpec } from "@/lib/deepseek";

const mockedGenerateVideoSpec = vi.mocked(generateVideoSpec);

describe("POST /api/generate", () => {
  it("returns 400 when prompt is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Prompt is required.",
    });
  });

  it("returns generated spec and compiled video props", async () => {
    mockedGenerateVideoSpec.mockResolvedValueOnce({
      source: "deepseek",
      model: "deepseek-chat",
      warning: null,
      spec: {
        projectType: "product-intro",
        aspectRatio: "16:9",
        durationSec: 12,
        language: "zh-CN",
        brandTone: "futuristic",
        productName: "agentE",
        tagline: "把一句话变成可预览的视频草稿",
        targetAudience: "产品团队与设计团队",
        cta: "开始体验产品视频",
        scenes: [
          {
            kind: "hero",
            eyebrow: "START",
            title: "一句话输入也能稳定成片",
            body: "从这里开始，把自然语言先转换成结构化场景数据。",
            bullets: ["Prompt"],
          },
          {
            kind: "feature",
            eyebrow: "WHY",
            title: "结构化生成更容易维护",
            body: "中间屏负责说清楚模板策略、视觉风格和信息层次。",
            bullets: ["Schema"],
          },
          {
            kind: "cta",
            eyebrow: "NEXT",
            title: "立即体验 agentE",
            body: "最后一屏做 CTA，并把下载和预览路径讲明白。",
            bullets: ["立即体验 agentE"],
          },
        ],
      },
    });

    const response = await POST(
      new Request("http://localhost/api/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: "test prompt" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);

    const payload = await response.json();

    expect(payload.source).toBe("deepseek");
    expect(payload.videoProps.productName).toBe("agentE");
    expect(payload.videoProps.scenes).toHaveLength(3);
  });
});
