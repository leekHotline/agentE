import { NextResponse } from "next/server";
import { renderVideo } from "@/lib/render-video";
import { agentEVideoPropsSchema } from "@/lib/video-spec";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { videoProps?: unknown };
    const videoProps = agentEVideoPropsSchema.parse(body.videoProps);
    const result = await renderVideo(videoProps);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to render video.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
