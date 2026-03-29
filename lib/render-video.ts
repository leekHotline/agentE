import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { AgentEVideoProps, agentEVideoPropsSchema } from "@/lib/video-spec";
import {
  createRenderId,
  ensureArtifactDirs,
  getRenderPaths,
} from "@/lib/render-storage";

type RenderVideoResult = {
  renderId: string;
  downloadUrl: string;
  outputPath: string;
  logPath: string;
};

const runRenderCommand = async (
  entryPoint: string,
  outputPath: string,
  propsPath: string,
) => {
  return new Promise<{ code: number | null; log: string }>((resolve, reject) => {
    const child = spawn(
      "pnpm.cmd",
      [
        "exec",
        "remotion",
        "render",
        entryPoint,
        "AgentEProductIntro",
        outputPath,
        `--props=${propsPath}`,
      ],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          REMOTION_DISABLE_TELEMETRY: "1",
        },
        shell: true,
      },
    );

    let log = "";

    child.stdout.on("data", (chunk) => {
      log += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      log += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      resolve({ code, log });
    });
  });
};

export const renderVideo = async (
  input: AgentEVideoProps,
): Promise<RenderVideoResult> => {
  const videoProps = agentEVideoPropsSchema.parse(input);

  await ensureArtifactDirs();

  const renderId = createRenderId();
  const { requestPath, outputPath, metadataPath, logPath } =
    getRenderPaths(renderId);
  const entryPoint = path.join(process.cwd(), "remotion", "index.ts");

  await writeFile(requestPath, JSON.stringify(videoProps, null, 2), "utf8");

  const { code, log } = await runRenderCommand(entryPoint, outputPath, requestPath);

  await writeFile(logPath, log, "utf8");

  if (code !== 0) {
    throw new Error(log || `Render failed with exit code ${code ?? "unknown"}.`);
  }

  await writeFile(
    metadataPath,
    JSON.stringify(
      {
        renderId,
        createdAt: new Date().toISOString(),
        outputPath,
        props: videoProps,
      },
      null,
      2,
    ),
    "utf8",
  );

  return {
    renderId,
    downloadUrl: `/api/renders/${renderId}`,
    outputPath,
    logPath,
  };
};
