export interface VisualAnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

export interface VisualAnnotation {
  id: string;
  index: number;
  instruction: string;
  elementSelector: string;
  tagName: string;
  tailwindClasses: string;
  url: string;
  pageTitle: string;
  screenResolution: string;
  rect: VisualAnnotationRect;
  imageDataUrl: string; // High-def / full snapshot
  thumbnailDataUrl: string; // Compact snapshot for GitHub issue body
  createdAt: string;
}

export type IssueLabelType = "bug" | "enhancement";

export interface CreateGitHubIssueInput {
  title: string;
  body: string;
  labels?: IssueLabelType[];
  repo?: string;
}

export interface CreateGitHubIssueResult {
  success: boolean;
  issueNumber?: number;
  issueUrl?: string;
  error?: string;
}
