import { describe, expect, it } from "vitest";
import { compileVideoSpec } from "@/lib/template-engine";

describe("compileVideoSpec", () => {
  it("sorts scenes into the render order and derives CTA from the cta scene", () => {
    const compiled = compileVideoSpec({
      projectType: "product-intro",
      aspectRatio: "16:9",
      durationSec: 12,
      language: "zh-CN",
      brandTone: "clean",
      productName: "agentE",
      tagline: "把一句话变成视频草稿",
      targetAudience: "产品团队",
      cta: "默认 CTA",
      scenes: [
        {
          kind: "cta",
          eyebrow: "NEXT",
          title: "马上开始",
          body: "最后一屏负责收口。",
          bullets: ["立即体验"],
        },
        {
          kind: "proof",
          eyebrow: "PROOF",
          title: "结果更稳定",
          body: "模板优先可以减少编译失败。",
          bullets: ["结构化输出"],
        },
        {
          kind: "hero",
          eyebrow: "START",
          title: "一句话输入",
          body: "前面先用 hero 开场。",
          bullets: ["Prompt"],
        },
      ],
    });

    expect(compiled.scenes.map((scene) => scene.kind)).toEqual([
      "hero",
      "proof",
      "cta",
    ]);
    expect(compiled.cta).toBe("立即体验");
  });
});
