import { NextResponse } from "next/server";
import { generateVideoSpec } from "@/lib/deepseek";
import { compileVideoSpec } from "@/lib/template-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const generation = await generateVideoSpec(prompt);
    const videoProps = compileVideoSpec(generation.spec);

    return NextResponse.json({
      source: generation.source,
      model: generation.model,
      warning: generation.warning,
      spec: generation.spec,
      videoProps,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate video spec.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
