import { z } from "zod";
import {
  MAX_DURATION_SECONDS,
  MIN_DURATION_SECONDS,
} from "./constants";

export const videoSceneSchema = z.object({
  kind: z.enum(["hero", "feature", "proof", "cta"]),
  eyebrow: z.string().trim().min(2).max(28),
  title: z.string().trim().min(4).max(72),
  body: z.string().trim().min(8).max(180),
  bullets: z.array(z.string().trim().min(2).max(48)).max(3).default([]),
});

export const videoSpecSchema = z.object({
  projectType: z.literal("product-intro"),
  aspectRatio: z.literal("16:9").default("16:9"),
  durationSec: z
    .number()
    .int()
    .min(MIN_DURATION_SECONDS)
    .max(MAX_DURATION_SECONDS),
  language: z.enum(["zh-CN", "en-US"]).default("zh-CN"),
  brandTone: z.enum(["clean", "bold", "futuristic"]).default("clean"),
  productName: z.string().trim().min(2).max(40),
  tagline: z.string().trim().min(6).max(72),
  targetAudience: z.string().trim().min(2).max(40),
  cta: z.string().trim().min(2).max(28),
  scenes: z.array(videoSceneSchema).min(3).max(4),
});

export const agentEVideoPropsSchema = z.object({
  productName: z.string().trim().min(2).max(40),
  tagline: z.string().trim().min(6).max(72),
  targetAudience: z.string().trim().min(2).max(40),
  durationSec: z
    .number()
    .int()
    .min(MIN_DURATION_SECONDS)
    .max(MAX_DURATION_SECONDS),
  language: z.enum(["zh-CN", "en-US"]),
  brandTone: z.enum(["clean", "bold", "futuristic"]),
  cta: z.string().trim().min(2).max(28),
  scenes: z.array(videoSceneSchema).min(3).max(4),
});

export type VideoScene = z.infer<typeof videoSceneSchema>;
export type VideoSpec = z.infer<typeof videoSpecSchema>;
export type AgentEVideoProps = z.infer<typeof agentEVideoPropsSchema>;
