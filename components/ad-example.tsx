import React from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const IntroText: React.FC = () => {
  const frame = useCurrentFrame();
  // 0-30帧淡入, 30-60帧保持, 60-90帧淡出
  const opacity = interpolate(frame, [0, 30, 60, 90], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <h1
        style={{
          color: "white",
          opacity,
          fontSize: 60,
          fontWeight: 200,
          letterSpacing: "0.2em",
          fontFamily: "sans-serif",
        }}
      >
        test ad example
      </h1>
    </AbsoluteFill>
  );
};

