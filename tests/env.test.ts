import { afterEach, describe, expect, it, vi } from "vitest";
import { getDeepSeekConfig, resetEnvCacheForTests } from "@/lib/env";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  resetEnvCacheForTests();
  vi.restoreAllMocks();
});

describe("getDeepSeekConfig", () => {
  it("reads the DeepSeek key from process env and applies defaults", () => {
    process.env.DS_API_KEY = "test-key";
    delete process.env.BASE_URL;
    delete process.env.DEEPSEEK_MODEL;
    resetEnvCacheForTests();

    expect(getDeepSeekConfig()).toEqual({
      apiKey: "test-key",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
    });
  });

  it("throws when the DeepSeek key is missing", () => {
    delete process.env.DS_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    resetEnvCacheForTests();
    vi.spyOn(process, "cwd").mockReturnValue("Z:/missing-env-dir");

    expect(() => getDeepSeekConfig()).toThrow("Missing DeepSeek API key");
  });
});
