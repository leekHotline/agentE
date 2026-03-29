import { readFileSync } from "node:fs";
import path from "node:path";

const dotenvCache = new Map<string, string>();

const loadDotenv = () => {
  if (dotenvCache.size > 0) {
    return dotenvCache;
  }

  const envPath = path.join(process.cwd(), ".env");

  try {
    const content = readFileSync(envPath, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key) {
        dotenvCache.set(key, value);
      }
    }
  } catch {
    return dotenvCache;
  }

  return dotenvCache;
};

const readEnvValue = (...keys: string[]) => {
  const dotenv = loadDotenv();

  for (const key of keys) {
    const fromProcess = process.env[key];

    if (fromProcess && fromProcess.trim()) {
      return fromProcess.trim();
    }

    const fromDotenv = dotenv.get(key);

    if (fromDotenv && fromDotenv.trim()) {
      return fromDotenv.trim();
    }
  }

  return null;
};

export const resetEnvCacheForTests = () => {
  dotenvCache.clear();
};

export const getDeepSeekConfig = () => {
  const apiKey = readEnvValue("DS_API_KEY", "DEEPSEEK_API_KEY");
  const baseUrl =
    readEnvValue("BASE_URL", "DEEPSEEK_BASE_URL") ??
    "https://api.deepseek.com";
  const model = readEnvValue("DS_MODEL", "DEEPSEEK_MODEL") ?? "deepseek-chat";

  if (!apiKey) {
    throw new Error(
      "Missing DeepSeek API key. Add DS_API_KEY or DEEPSEEK_API_KEY to agentE/.env.",
    );
  }

  return {
    apiKey,
    baseUrl,
    model,
  };
};
