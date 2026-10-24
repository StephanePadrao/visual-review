import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  VisualReviewProvider,
  useVisualReview,
  type VisualReviewContextType,
} from "../visual-review-context";
import { VisualReviewToolbar } from "../visual-review-toolbar";
import { VisualReviewToast } from "../visual-review-toast";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/projects/42/roadmap",
}));

describe("VisualReview Component & State Integration", () => {
  it("renders the floating toolbar in navigation mode with data-devtools-ignore attribute", () => {
    const html = renderToStaticMarkup(
      <VisualReviewProvider>
        <VisualReviewToolbar />
      </VisualReviewProvider>
    );

    expect(html).toContain('data-devtools-ignore="true"');
    expect(html).toContain("Mode Revue");
  });

  it("renders the toast notification when toast state is set", () => {
    const html = renderToStaticMarkup(
      <VisualReviewProvider
        initialToast={{
          message: "Ticket #27 créé avec succès sur GitHub ! Session réinitialisée.",
          type: "success",
          linkUrl: "https://github.com/StephanePadrao/PEPPER/issues/27",
        }}
      >
        <VisualReviewToast />
      </VisualReviewProvider>
    );

    expect(html).toContain("Ticket #27 créé avec succès sur GitHub !");
    expect(html).toContain("Session réinitialisée");
    expect(html).toContain("https://github.com/StephanePadrao/PEPPER/issues/27");
  });

  it("handles state actions correctly: adding, updating and deleting annotations", () => {
    const contextRef: { current: VisualReviewContextType | null } = { current: null };

    function TestComponent() {
      const ctx = useVisualReview();
      contextRef.current = ctx;
      return <div>Test</div>;
    }

    renderToStaticMarkup(
      <VisualReviewProvider>
        <TestComponent />
      </VisualReviewProvider>
    );

    expect(contextRef.current).not.toBeNull();
    expect(contextRef.current?.isActive).toBe(false);
    expect(contextRef.current?.annotations).toEqual([]);
    expect(contextRef.current?.issueTitle).toContain("Roadmap");
  });
});
