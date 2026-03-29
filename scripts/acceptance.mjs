const prompt =
  "为一款 AI 设计助手生成 12 秒中文产品介绍视频，强调一句话生成落地页、配色建议和 60fps 导出。";

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const requestJson = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  assert(response.ok, `Request failed for ${url}: ${text}`);

  return parsed;
};

const main = async () => {
  const baseUrl = "http://127.0.0.1:3100";

  const generated = await requestJson(`${baseUrl}/api/generate`, { prompt });

  assert(generated.source === "deepseek", "Generate step did not use DeepSeek.");
  assert(generated.warning === null, `Generate step returned warning: ${generated.warning}`);
  assert(generated.videoProps?.scenes?.length >= 3, "Video props missing scenes.");

  const renderPayload = {
    ...generated.videoProps,
    durationSec: Math.min(generated.videoProps.durationSec, 12),
  };

  const rendered = await requestJson(`${baseUrl}/api/render`, {
    videoProps: renderPayload,
  });

  assert(rendered.downloadUrl, "Render response missing downloadUrl.");

  const videoResponse = await fetch(`${baseUrl}${rendered.downloadUrl}`);
  const buffer = Buffer.from(await videoResponse.arrayBuffer());

  assert(videoResponse.ok, "Rendered video download failed.");
  assert(
    videoResponse.headers.get("content-type") === "video/mp4",
    "Rendered artifact is not an MP4.",
  );
  assert(buffer.byteLength > 1024 * 1024, "Rendered video is unexpectedly small.");

  console.log(
    JSON.stringify(
      {
        prompt,
        source: generated.source,
        model: generated.model,
        renderId: rendered.renderId,
        bytes: buffer.byteLength,
      },
      null,
      2,
    ),
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
