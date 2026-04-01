import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MvpStudio } from "@/components/mvp-studio";

describe("MvpStudio", () => {
  it("renders the simplified workflow UI", () => {
    render(<MvpStudio />);

    expect(
      screen.getByRole("heading", {
        name: "简洁地看见生成流程，而不是被界面淹没。",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "生成 VideoSpec" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Refresh 渐进出现" }),
    ).toBeInTheDocument();

    expect(
      (screen.getByTestId("prompt-input") as HTMLTextAreaElement).value,
    ).toContain("AI 设计助手");
  });
});
