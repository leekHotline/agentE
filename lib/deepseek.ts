import OpenAI from "openai";
import {
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_DEEPSEEK_MODEL,
  MAX_DURATION_SECONDS,
  MIN_DURATION_SECONDS,
} from "@/lib/constants";
import {
  VideoSpec,
  videoSpecSchema,
} from "@/lib/video-spec";
import { getDeepSeekConfig } from "@/lib/env";

const detectLanguage = (prompt: string) => {
  return /[\u4e00-\u9fff]/.test(prompt) ? "zh-CN" : "en-US";
};

const detectTone = (prompt: string): VideoSpec["brandTone"] => {
  if (/科技|未来|赛博|tech|future|ai/i.test(prompt)) {
    return "futuristic";
  }

  if (/bold|impact|冲击|强烈|增长/i.test(prompt)) {
    return "bold";
  }

  return "clean";
};

const guessProductName = (prompt: string, language: VideoSpec["language"]) => {
  const quoted =
    prompt.match(/“([^”]+)”/)?.[1] ??
    prompt.match(/"([^"]+)"/)?.[1] ??
    prompt.match(/‘([^’]+)’/)?.[1] ??
    prompt.match(/'([^']+)'/)?.[1];

  if (quoted) {
    return quoted.slice(0, 40);
  }

  const normalized = prompt
    .replace(/[\r\n]+/g, " ")
    .replace(/[，。！？,.!?]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, language === "zh-CN" ? 4 : 3)
    .join(language === "zh-CN" ? "" : " ");

  if (normalized.length >= 2) {
    return normalized.slice(0, 40);
  }

  return language === "zh-CN" ? "AI 产品" : "AI Product";
};

const extractJsonObject = (content: string) => {
  const cleaned = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");

  if (firstBrace === -1) {
    throw new Error("No JSON object found in model response.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = firstBrace; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;

      if (depth === 0) {
        return cleaned.slice(firstBrace, index + 1);
      }
    }
  }

  throw new Error("Unclosed JSON object in model response.");
};

const buildFallbackSpec = (prompt: string): VideoSpec => {
  const language = detectLanguage(prompt);
  const tone = detectTone(prompt);
  const productName = guessProductName(prompt, language);
  const chunks = prompt
    .split(/[\r\n。！？!?；;，,]/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length >= 4)
    .slice(0, 6);

  const lead = chunks[0] ?? prompt.trim();
  const featureA =
    chunks[1] ??
    (language === "zh-CN"
      ? "更快生成视频草稿"
      : "Generate a polished video draft");
  const featureB =
    chunks[2] ??
    (language === "zh-CN"
      ? "模板化输出更稳定"
      : "Template-driven output stays stable");
  const featureC =
    chunks[3] ??
    (language === "zh-CN"
      ? "支持预览和 MP4 导出"
      : "Preview and export in one flow");

  return videoSpecSchema.parse({
    projectType: "product-intro",
    aspectRatio: "16:9",
    durationSec: 12,
    language,
    brandTone: tone,
    productName,
    tagline: language === "zh-CN" ? lead.slice(0, 60) : lead.slice(0, 68),
    targetAudience:
      language === "zh-CN"
        ? "产品团队与独立开发者"
        : "product teams and indie builders",
    cta: language === "zh-CN" ? "生成第一版视频" : "Generate the first cut",
    scenes: [
      {
        kind: "hero",
        eyebrow: "PROMPT TO VIDEO",
        title:
          language === "zh-CN"
            ? `${productName}，一句话开工`
            : `${productName}, from one prompt to a video draft`,
        body:
          language === "zh-CN"
            ? "先生成结构化 VideoSpec，再编译到 Remotion 组合，减少不可控代码输出。"
            : "Generate a structured VideoSpec first, then compile it into a Remotion composition.",
        bullets:
          language === "zh-CN"
            ? ["自然语言输入", "结构化 spec", "模板化编译"]
            : ["Prompt input", "Structured spec", "Template compile"],
      },
      {
        kind: "feature",
        eyebrow: "CORE VALUE",
        title:
          language === "zh-CN"
            ? "先把 MVP 主链跑通"
            : "Ship the MVP path before expanding scope",
        body:
          language === "zh-CN"
            ? "当前版本优先解决生成、预览、导出三件事，不在任意 TSX 代码执行上冒险。"
            : "This version prioritizes generate, preview, and export before opening up arbitrary TSX execution.",
        bullets: [featureA.slice(0, 48), featureB.slice(0, 48), featureC.slice(0, 48)],
      },
      {
        kind: "proof",
        eyebrow: "WHY STABLE",
        title:
          language === "zh-CN"
            ? "模板优先，结果更可控"
            : "Template-first output is easier to trust",
        body:
          language === "zh-CN"
            ? "把 prompt 收敛成 scene 数据，能减少编译失败、样式漂移和调试成本。"
            : "Constraining prompts into scene data reduces compile failures, visual drift, and debugging cost.",
        bullets:
          language === "zh-CN"
            ? ["固定 16:9", "本地 MP4", "60fps 导出"]
            : ["Fixed 16:9", "Local MP4", "60fps export"],
      },
      {
        kind: "cta",
        eyebrow: "NEXT STEP",
        title:
          language === "zh-CN"
            ? "现在就生成第一版产品视频"
            : "Generate the first product video draft now",
        body:
          language === "zh-CN"
            ? "这一版适合产品介绍、功能发布和简短演示视频。"
            : "This MVP is optimized for product intros, feature launches, and short demo videos.",
        bullets: [language === "zh-CN" ? "生成第一版视频" : "Generate the first cut"],
      },
    ],
  });
};

const SYSTEM_PROMPT = `
You are an expert product video planner.
Return one valid JSON object only.
Do not use markdown fences.

The JSON must follow this schema:
{
  "projectType": "product-intro",
  "aspectRatio": "16:9",
  "durationSec": number between ${MIN_DURATION_SECONDS} and ${MAX_DURATION_SECONDS},
  "language": "zh-CN" or "en-US",
  "brandTone": "clean" or "bold" or "futuristic",
  "productName": string,
  "tagline": string,
  "targetAudience": string,
  "cta": string,
  "scenes": [
    {
      "kind": "hero" | "feature" | "proof" | "cta",
      "eyebrow": string,
      "title": string,
      "body": string,
      "bullets": string[]
    }
  ]
}

Rules:
- The video is for a product intro or feature announcement.
- Keep scene count between 3 and 4.
- Keep bullets concise and actionable, max 3 per scene.
- Use the same language as the user prompt.
- Write copy that is polished and presentation-ready.
- Never add explanations outside the JSON object.
`.trim();

type GenerateVideoSpecResult = {
  spec: VideoSpec;
  source: "deepseek" | "fallback";
  model: string;
  warning: string | null;
};

export const generateVideoSpec = async (
  prompt: string,
): Promise<GenerateVideoSpecResult> => {
  const normalizedPrompt = prompt.trim();

  if (!normalizedPrompt) {
    throw new Error("Prompt is required.");
  }

  const { apiKey, baseUrl, model } = getDeepSeekConfig();
  const resolvedBaseUrl = baseUrl || DEFAULT_DEEPSEEK_BASE_URL;
  const resolvedModel = model || DEFAULT_DEEPSEEK_MODEL;

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: resolvedBaseUrl,
    });

    const completion = await client.chat.completions.create({
      model: resolvedModel,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: normalizedPrompt,
        },
      ],
    });

    const message = completion.choices[0]?.message?.content;
    const content = Array.isArray(message)
      ? message
          .map((part) => ("text" in part && part.text ? part.text : ""))
          .join("\n")
      : message ?? "";
    const parsedJson = extractJsonObject(content);
    const parsedSpec = videoSpecSchema.parse(JSON.parse(parsedJson));

    return {
      spec: parsedSpec,
      source: "deepseek",
      model: resolvedModel,
      warning: null,
    };
  } catch (error) {
    const fallbackSpec = buildFallbackSpec(normalizedPrompt);
    const message =
      error instanceof Error ? error.message : "Unknown DeepSeek error";

    return {
      spec: fallbackSpec,
      source: "fallback",
      model: resolvedModel,
      warning: `DeepSeek generation failed, used fallback spec instead: ${message}`,
    };
  }
};
