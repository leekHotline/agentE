import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import {
  AgentEVideoProps,
  agentEVideoPropsSchema,
} from "../lib/video-spec";
import {
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../lib/constants";
import { defaultAgentEVideoProps } from "../lib/template-engine";
import { AgentEVideo } from "./AgentEVideo";

const calculateMetadata: CalculateMetadataFunction<AgentEVideoProps> = async ({
  props,
}) => {
  const validated = agentEVideoPropsSchema.parse(props);

  return {
    durationInFrames: validated.durationSec * VIDEO_FPS,
    fps: VIDEO_FPS,
    width: VIDEO_WIDTH,
    height: VIDEO_HEIGHT,
    props: validated,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="AgentEProductIntro"
      component={AgentEVideo}
      durationInFrames={defaultAgentEVideoProps.durationSec * VIDEO_FPS}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      schema={agentEVideoPropsSchema}
      calculateMetadata={calculateMetadata}
      defaultProps={defaultAgentEVideoProps}
    />
  );
};
