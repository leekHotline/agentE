import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { NextResponse } from "next/server";
import { getRenderPaths } from "@/lib/render-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ renderId: string }> },
) {
  const { renderId } = await context.params;
  const { outputPath } = getRenderPaths(renderId);

  if (!existsSync(outputPath)) {
    return NextResponse.json({ error: "Render not found." }, { status: 404 });
  }

  const file = await readFile(outputPath);

  return new NextResponse(file, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${renderId}.mp4"`,
      "Cache-Control": "no-store",
    },
  });
}
