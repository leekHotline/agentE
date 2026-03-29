import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const generatedRoot = path.join(process.cwd(), ".generated");
const requestRoot = path.join(generatedRoot, "requests");
const renderRoot = path.join(generatedRoot, "renders");
const logRoot = path.join(generatedRoot, "logs");

export const ensureArtifactDirs = async () => {
  await Promise.all([
    mkdir(generatedRoot, { recursive: true }),
    mkdir(requestRoot, { recursive: true }),
    mkdir(renderRoot, { recursive: true }),
    mkdir(logRoot, { recursive: true }),
  ]);
};

export const createRenderId = () => {
  return `${Date.now()}-${randomUUID().slice(0, 8)}`;
};

export const getRenderPaths = (renderId: string) => {
  return {
    requestPath: path.join(requestRoot, `${renderId}.json`),
    outputPath: path.join(renderRoot, `${renderId}.mp4`),
    metadataPath: path.join(renderRoot, `${renderId}.meta.json`),
    logPath: path.join(logRoot, `${renderId}.log`),
  };
};
