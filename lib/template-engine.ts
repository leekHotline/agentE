import {
  AgentEVideoProps,
  agentEVideoPropsSchema,
  VideoScene,
  VideoSpec,
  videoSpecSchema,
} from "./video-spec";

const normalizeScene = (scene: VideoScene): VideoScene => {
  return {
    ...scene,
    eyebrow: scene.eyebrow.trim(),
    title: scene.title.trim(),
    body: scene.body.trim(),
    bullets: scene.bullets
      .map((bullet) => bullet.trim())
      .filter(Boolean)
      .slice(0, 3),
  };
};

const sortScenes = (scenes: VideoScene[]) => {
  const rank: Record<VideoScene["kind"], number> = {
    hero: 0,
    feature: 1,
    proof: 2,
    cta: 3,
  };

  return [...scenes].sort((left, right) => rank[left.kind] - rank[right.kind]);
};

export const compileVideoSpec = (input: VideoSpec): AgentEVideoProps => {
  const spec = videoSpecSchema.parse(input);
  const orderedScenes = sortScenes(spec.scenes).map(normalizeScene);
  const ctaScene = orderedScenes.at(-1);

  return agentEVideoPropsSchema.parse({
    productName: spec.productName,
    tagline: spec.tagline,
    targetAudience: spec.targetAudience,
    durationSec: spec.durationSec,
    language: spec.language,
    brandTone: spec.brandTone,
    cta:
      ctaScene?.kind === "cta" && ctaScene.bullets[0]
        ? ctaScene.bullets[0]
        : spec.cta,
    scenes: orderedScenes,
  });
};

export const defaultVideoSpec: VideoSpec = {
  projectType: "product-intro",
  aspectRatio: "16:9",
  durationSec: 12,
  language: "zh-CN",
  brandTone: "futuristic",
  productName: "agentE",
  tagline: "把一句自然语言，稳定生成可预览、可导出的产品视频。",
  targetAudience: "独立开发者与产品团队",
  cta: "生成第一版视频",
  scenes: [
    {
      kind: "hero",
      eyebrow: "AI VIDEO ENGINE",
      title: "一句话输入，直接生成视频草稿",
      body: "agentE 先生成结构化 VideoSpec，再编译成受控的 Remotion 模板。",
      bullets: ["自然语言输入", "Schema 校验", "模板编译"],
    },
    {
      kind: "feature",
      eyebrow: "WHY IT WORKS",
      title: "先把生成、预览、导出三步做稳",
      body: "模型负责内容规划，模板负责视觉实现，减少任意代码生成带来的不稳定性。",
      bullets: ["Scene 复用", "输出稳定", "调试可追踪"],
    },
    {
      kind: "proof",
      eyebrow: "MVP PATH",
      title: "当前闭环已经覆盖到 MP4 交付",
      body: "这版先聚焦 16:9 产品介绍视频，支持本地预览、真实渲染和 60fps 导出。",
      bullets: ["DeepSeek", "Next.js", "Remotion 60fps"],
    },
    {
      kind: "cta",
      eyebrow: "NEXT STEP",
      title: "先把产品介绍和功能发布视频做透",
      body: "大模型负责理解意图，模板负责保证质量，后续再接素材上传、字幕和浏览器捕获。",
      bullets: ["生成第一版视频"],
    },
  ],
};

export const defaultAgentEVideoProps = compileVideoSpec(defaultVideoSpec);
