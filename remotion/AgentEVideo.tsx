import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { AgentEVideoProps } from "../lib/video-spec";

const paletteByTone: Record<
  AgentEVideoProps["brandTone"],
  {
    background: string;
    panel: string;
    line: string;
    text: string;
    muted: string;
    accent: string;
    accentAlt: string;
  }
> = {
  clean: {
    background:
      "linear-gradient(135deg, #f6f7f2 0%, #d9efe5 48%, #eff8ff 100%)",
    panel: "rgba(255,255,255,0.74)",
    line: "rgba(15, 23, 42, 0.08)",
    text: "#0f172a",
    muted: "#475569",
    accent: "#0f766e",
    accentAlt: "#ea580c",
  },
  bold: {
    background:
      "linear-gradient(145deg, #190f0f 0%, #3f1313 42%, #1d1237 100%)",
    panel: "rgba(255,255,255,0.08)",
    line: "rgba(255,255,255,0.16)",
    text: "#fff6f2",
    muted: "#ffd7cc",
    accent: "#ff7a59",
    accentAlt: "#ffd166",
  },
  futuristic: {
    background:
      "linear-gradient(140deg, #020617 0%, #071b2f 42%, #031018 100%)",
    panel: "rgba(6, 17, 31, 0.62)",
    line: "rgba(120, 255, 214, 0.2)",
    text: "#effdf7",
    muted: "#a6c7bd",
    accent: "#7ef9eb",
    accentAlt: "#c7ff6f",
  },
};

const springIn = (frame: number, fps: number, delay: number) => {
  return spring({
    frame: frame - delay,
    fps,
    durationInFrames: 28,
    config: {
      damping: 200,
      stiffness: 120,
      mass: 0.9,
    },
  });
};

const ScenePanel: React.FC<{
  scene: AgentEVideoProps["scenes"][number];
  productName: string;
  targetAudience: string;
  tone: AgentEVideoProps["brandTone"];
}> = ({ scene, productName, targetAudience, tone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = paletteByTone[tone];
  const badge = springIn(frame, fps, 0);
  const title = springIn(frame, fps, 4);
  const body = springIn(frame, fps, 8);
  const bullets = springIn(frame, fps, 12);
  const outOpacity = interpolate(frame, [120, 156], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const drift = interpolate(frame, [0, 160], [0, -24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: "88px 96px",
        opacity: outOpacity,
        transform: `translateY(${drift}px)`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr 0.95fr",
          gap: 28,
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: 36,
            padding: 40,
            border: `1px solid ${palette.line}`,
            background: palette.panel,
            backdropFilter: "blur(24px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                opacity: badge,
                transform: `translateY(${(1 - badge) * 22}px)`,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                width: "fit-content",
                borderRadius: 999,
                border: `1px solid ${palette.line}`,
                color: palette.accent,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: palette.accentAlt,
                }}
              />
              {scene.eyebrow}
            </div>
            <div
              style={{
                opacity: title,
                transform: `translateY(${(1 - title) * 28}px)`,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  color: palette.text,
                  fontSize: 72,
                  lineHeight: 1.02,
                  letterSpacing: "-0.06em",
                  fontWeight: 700,
                }}
              >
                {scene.title}
              </h1>
            </div>
            <div
              style={{
                opacity: body,
                transform: `translateY(${(1 - body) * 24}px)`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: palette.muted,
                  fontSize: 28,
                  lineHeight: 1.45,
                  fontWeight: 500,
                }}
              >
                {scene.body}
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              opacity: bullets,
              transform: `translateY(${(1 - bullets) * 24}px)`,
            }}
          >
            {scene.bullets.map((bullet) => (
              <div
                key={bullet}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 18px",
                  borderRadius: 18,
                  border: `1px solid ${palette.line}`,
                  background: "rgba(255,255,255,0.04)",
                  color: palette.text,
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: palette.accent,
                  }}
                />
                {bullet}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 36,
            border: `1px solid ${palette.line}`,
            background: palette.panel,
            boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 20% 18%, rgba(255,255,255,0.14), transparent 26%), radial-gradient(circle at 82% 20%, rgba(255,255,255,0.12), transparent 22%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 24,
              borderRadius: 28,
              border: `1px solid ${palette.line}`,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div
                style={{
                  color: palette.accent,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                }}
              >
                {productName}
              </div>
              <div
                style={{
                  color: palette.muted,
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                {targetAudience}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {scene.bullets.map((bullet, index) => (
                <div
                  key={`${bullet}-${index}`}
                  style={{
                    minHeight: 152,
                    borderRadius: 24,
                    padding: 20,
                    border: `1px solid ${palette.line}`,
                    background: "rgba(255,255,255,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      color: palette.muted,
                      fontSize: 16,
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                    }}
                  >
                    0{index + 1}
                  </div>
                  <div
                    style={{
                      color: palette.text,
                      fontSize: 28,
                      lineHeight: 1.18,
                      fontWeight: 700,
                    }}
                  >
                    {bullet}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 20px",
                borderRadius: 24,
                border: `1px solid ${palette.line}`,
                background: "rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  color: palette.text,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                Template-first render pipeline
              </div>
              <div
                style={{
                  color: palette.accentAlt,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                60 FPS
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const BackgroundLayer: React.FC<{ tone: AgentEVideoProps["brandTone"] }> = ({
  tone,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const palette = paletteByTone[tone];
  const drift = interpolate(frame, [0, 720], [0, -120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        background: palette.background,
      }}
    >
      {Array.from({ length: 12 }).map((_, index) => {
        const progress = (index + 1) / 13;

        return (
          <div
            key={`vertical-${index}`}
            style={{
              position: "absolute",
              top: -120,
              left: `${progress * 100}%`,
              width: 1,
              height: height + 240,
              transform: `translateY(${drift * (0.35 + progress * 0.2)}px)`,
              background: `linear-gradient(180deg, transparent, ${palette.line}, transparent)`,
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: 120,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: `${palette.accent}30`,
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -120,
          left: 100,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: `${palette.accentAlt}22`,
          filter: "blur(110px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.1))",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 28,
          borderRadius: 42,
          border: `1px solid ${palette.line}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 42,
          right: 42,
          top: 42,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: palette.muted,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        <span>agentE MVP</span>
        <span>Prompt to MP4</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 42,
          right: 42,
          bottom: 42,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: palette.muted,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: "0.12em",
        }}
      >
        <span>Template compiled from VideoSpec</span>
        <span>
          {width}x{height}
        </span>
      </div>
    </AbsoluteFill>
  );
};

export const AgentEVideo: React.FC<AgentEVideoProps> = (props) => {
  const { durationInFrames } = useVideoConfig();
  const sceneCount = props.scenes.length;
  const sceneWindow = Math.floor(durationInFrames / sceneCount);

  return (
    <AbsoluteFill>
      <BackgroundLayer tone={props.brandTone} />

      {props.scenes.map((scene, index) => {
        const from = index * sceneWindow;
        const remaining = durationInFrames - from;
        const duration = index === sceneCount - 1 ? remaining : sceneWindow + 18;

        return (
          <Sequence
            key={`${scene.kind}-${index}`}
            from={from}
            durationInFrames={duration}
          >
            <ScenePanel
              scene={scene}
              productName={props.productName}
              targetAudience={props.targetAudience}
              tone={props.brandTone}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
