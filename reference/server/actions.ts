"use server";

import type { CreateGitHubIssueInput, CreateGitHubIssueResult } from "@/types/visual-review";

/**
 * Server Action to create an issue on GitHub for the PEPPER repository
 */
export async function createGitHubIssueAction(
  input: CreateGitHubIssueInput
): Promise<CreateGitHubIssueResult> {
  try {
    const { title, body, labels = ["bug"], repo = "StephanePadrao/PEPPER" } = input;

    if (!title || !title.trim()) {
      return { success: false, error: "Le titre du ticket est obligatoire." };
    }

    if (!body || !body.trim()) {
      return { success: false, error: "Le contenu du ticket est obligatoire." };
    }

    // Resolve GitHub Token: check environment variables first
    let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

    // Automatic Fallback: retrieve active token from GitHub CLI (gh auth token) if logged in locally
    if (!token) {
      try {
        const { execSync } = await import("child_process");
        const cliToken = execSync("gh auth token", {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "ignore"],
        }).trim();
        if (cliToken && cliToken.startsWith("gh")) {
          token = cliToken;
        }
      } catch {
        // gh CLI token read failed or not installed
      }
    }

    if (!token) {
      return {
        success: false,
        error:
          "Token GitHub non configuré. Veuillez définir GITHUB_TOKEN dans vos variables d'environnement ou exécuter 'gh auth login'.",
      };
    }

    const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "PEPPER-DevTools/1.0",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title.trim(),
        body: body.trim(),
        labels,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || `Erreur HTTP ${response.status}`;
      return {
        success: false,
        error: `Échec de création du ticket GitHub : ${errorMsg}`,
      };
    }

    return {
      success: true,
      issueNumber: data.number,
      issueUrl: data.html_url,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inattendue";
    return {
      success: false,
      error: `Erreur interne du serveur : ${message}`,
    };
  }
}
