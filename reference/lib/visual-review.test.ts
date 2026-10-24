import { describe, it, expect } from "vitest";
import {
  getCircledNumber,
  getPageNameFromPath,
  generateDefaultIssueTitle,
  getElementSelector,
  getTailwindClasses,
  formatGitHubIssueBody,
  formatAIPrompt,
  type ElementLike,
} from "../visual-review";
import type { VisualAnnotation } from "@/types/visual-review";

describe("Visual Review Utilities", () => {
  describe("getCircledNumber", () => {
    it("returns unicode circled numbers for 1 through 20", () => {
      expect(getCircledNumber(1)).toBe("①");
      expect(getCircledNumber(2)).toBe("②");
      expect(getCircledNumber(3)).toBe("③");
      expect(getCircledNumber(10)).toBe("⑩");
      expect(getCircledNumber(20)).toBe("⑳");
    });

    it("falls back to parenthesized numbers for values greater than 20 or <= 0", () => {
      expect(getCircledNumber(21)).toBe("(21)");
      expect(getCircledNumber(42)).toBe("(42)");
      expect(getCircledNumber(0)).toBe("(0)");
    });
  });

  describe("getPageNameFromPath", () => {
    it("maps standard application paths to human-readable names", () => {
      expect(getPageNameFromPath("/")).toBe("Accueil");
      expect(getPageNameFromPath("/login")).toBe("Connexion");
      expect(getPageNameFromPath("/todo")).toBe("Todo Backlog");
      expect(getPageNameFromPath("/privacy")).toBe("Confidentialité");
      expect(getPageNameFromPath("/terms")).toBe("Conditions d'utilisation");
      expect(getPageNameFromPath("/projects/123/roadmap")).toBe("Roadmap");
      expect(getPageNameFromPath("/projects/123/backlog")).toBe("Backlog");
      expect(getPageNameFromPath("/projects/123/releases")).toBe("Releases");
      expect(getPageNameFromPath("/projects/123/settings")).toBe("Paramètres du Projet");
      expect(getPageNameFromPath("/projects/123/audit")).toBe("Audit Trail");
      expect(getPageNameFromPath("/projects/123")).toBe("Dashboard Projet");
      expect(getPageNameFromPath("/workspaces/abc")).toBe("Workspace");
    });
  });

  describe("generateDefaultIssueTitle", () => {
    it("generates structured issue titles with page name and singular/plural points", () => {
      expect(generateDefaultIssueTitle("/projects/123/roadmap", 1)).toBe(
        "fix(ui): Corrections d'interface sur Roadmap (1 point)"
      );
      expect(generateDefaultIssueTitle("/projects/123/roadmap", 3)).toBe(
        "fix(ui): Corrections d'interface sur Roadmap (3 points)"
      );
      expect(generateDefaultIssueTitle("/todo", 0)).toBe(
        "fix(ui): Corrections d'interface sur Todo Backlog (0 point)"
      );
    });
  });

  describe("getElementSelector & getTailwindClasses", () => {
    it("extracts selector with id if available", () => {
      const el = {
        tagName: "BUTTON",
        id: "submit-btn",
      };
      expect(getElementSelector(el)).toBe("#submit-btn");
    });

    it("extracts selector with data-testid if available", () => {
      const el = {
        tagName: "DIV",
        getAttribute: (attr: string) => (attr === "data-testid" ? "custom-card" : null),
      };
      expect(getElementSelector(el)).toBe('[data-testid="custom-card"]');
    });

    it("extracts hierarchy selector for nested elements", () => {
      const parent: ElementLike = {
        tagName: "DIV",
        className: "card-container",
      };
      const child: ElementLike = {
        tagName: "SPAN",
        className: "badge-label",
        parentElement: parent,
      };
      parent.children = [child];

      const selector = getElementSelector(child);
      expect(selector).toContain("span");
    });

    it("extracts tailwind classes", () => {
      const el = {
        tagName: "BUTTON",
        className: "px-4 py-2 bg-blue-600 text-white rounded-md",
      };
      expect(getTailwindClasses(el)).toBe("px-4 py-2 bg-blue-600 text-white rounded-md");
    });
  });

  describe("formatGitHubIssueBody", () => {
    const mockAnnotation1: VisualAnnotation = {
      id: "anno-1",
      index: 1,
      instruction: "Élargir la colonne à 320px",
      elementSelector: "div.grid > div:nth-child(2)",
      tagName: "DIV",
      tailwindClasses: "w-64 p-4 border rounded",
      url: "/projects/1/roadmap",
      pageTitle: "Roadmap",
      screenResolution: "1512x982 MacBook 14",
      rect: { x: 100, y: 150, width: 250, height: 400, scrollX: 0, scrollY: 0 },
      imageDataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      thumbnailDataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      createdAt: "2026-10-24T10:00:00.000Z",
    };

    const mockAnnotation2: VisualAnnotation = {
      id: "anno-2",
      index: 2,
      instruction: "La ligne verte chevauche l'indicateur d'aujourd'hui",
      elementSelector: "button.timeline-today",
      tagName: "BUTTON",
      tailwindClasses: "bg-emerald-500 text-white",
      url: "/projects/1/roadmap",
      pageTitle: "Roadmap",
      screenResolution: "1512x982 MacBook 14",
      rect: { x: 300, y: 200, width: 120, height: 35, scrollX: 0, scrollY: 0 },
      imageDataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      thumbnailDataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      createdAt: "2026-10-24T10:01:00.000Z",
    };

    it("formats a complete, valid markdown document with metadata, selectors and snapshots", () => {
      const markdown = formatGitHubIssueBody({
        annotations: [mockAnnotation1, mockAnnotation2],
        url: "/projects/1/roadmap",
        pageTitle: "Roadmap - PEPPER",
        screenResolution: "1512x982 MacBook 14",
      });

      // Title & metadata
      expect(markdown).toContain("## 🎯 Session de Revue Visuelle");
      expect(markdown).toContain("/projects/1/roadmap");
      expect(markdown).toContain("Roadmap - PEPPER");
      expect(markdown).toContain("1512x982 MacBook 14");
      expect(markdown).toContain("2 points");

      // Points details
      expect(markdown).toContain("### ① Point 1 : Élargir la colonne à 320px");
      expect(markdown).toContain("div.grid > div:nth-child(2)");
      expect(markdown).toContain(
        "### ② Point 2 : La ligne verte chevauche l'indicateur d'aujourd'hui"
      );
      expect(markdown).toContain("button.timeline-today");

      // Collapsible captures
      expect(markdown).toContain("<details>");
      expect(markdown).toContain("data:image/jpeg;base64");
    });

    it("safely enforces GitHub 65,536-character maximum body limit", () => {
      // Create a massive payload simulating oversized base64
      const giantAnnotation: VisualAnnotation = {
        ...mockAnnotation1,
        thumbnailDataUrl: "data:image/png;base64," + "A".repeat(70000),
      };

      const markdown = formatGitHubIssueBody({
        annotations: [giantAnnotation],
        url: "/projects/1/roadmap",
        pageTitle: "Roadmap",
        screenResolution: "1512x982",
      });

      expect(markdown.length).toBeLessThan(65536);
    });
  });

  describe("formatAIPrompt", () => {
    it("generates an expert structured AI prompt for LLM consumption", () => {
      const prompt = formatAIPrompt({
        annotations: [
          {
            id: "anno-1",
            index: 1,
            instruction: "Aligner les boutons à droite",
            elementSelector: "nav.header > div.actions",
            tagName: "DIV",
            tailwindClasses: "flex items-center gap-2",
            url: "/projects/42",
            pageTitle: "Dashboard",
            screenResolution: "1920x1080",
            rect: { x: 0, y: 0, width: 200, height: 50, scrollX: 0, scrollY: 0 },
            imageDataUrl: "",
            thumbnailDataUrl: "",
            createdAt: "",
          },
        ],
        url: "/projects/42",
        pageTitle: "Dashboard",
        screenResolution: "1920x1080",
      });

      expect(prompt).toContain("développeur full-stack expert sur le projet PEPPER");
      expect(prompt).toContain("/projects/42");
      expect(prompt).toContain("Aligner les boutons à droite");
      expect(prompt).toContain("nav.header > div.actions");
    });
  });
});
