/// <reference types="vitest" />
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

// Minimal test component
function Hello() {
  return <div>Hello Vitest</div>;
}

describe("Simple Test", () => {
  it("renders Hello Vitest", () => {
    render(<Hello />);
    expect(screen.getByText("Hello Vitest")).toBeInTheDocument();
  });
});
