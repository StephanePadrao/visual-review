import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createGitHubIssueAction } from "../actions";

const mockExecSync = vi.fn();
vi.mock("child_process", () => ({
  execSync: (...args: unknown[]) => mockExecSync(...args),
}));

describe("createGitHubIssueAction (Server Action)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockExecSync.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns error when title is empty or missing", async () => {
    const res = await createGitHubIssueAction({
      title: "   ",
      body: "Some description",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("titre du ticket est obligatoire");
  });

  it("returns error when body is empty or missing", async () => {
    const res = await createGitHubIssueAction({
      title: "fix(ui): test",
      body: "",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("contenu du ticket est obligatoire");
  });

  it("returns error when no GitHub token is configured and gh CLI fallback fails", async () => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GH_TOKEN;
    mockExecSync.mockImplementation(() => {
      throw new Error("gh not found");
    });

    const res = await createGitHubIssueAction({
      title: "fix(ui): issue without token",
      body: "Body",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Token GitHub non configuré");
  });

  it("creates GitHub issue successfully when token is valid", async () => {
    process.env.GITHUB_TOKEN = "ghp_mocktoken123456";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        number: 42,
        html_url: "https://github.com/StephanePadrao/PEPPER/issues/42",
      }),
    });
    global.fetch = mockFetch;

    const res = await createGitHubIssueAction({
      title: "fix(ui): Corrections d'interface sur Roadmap (2 points)",
      body: "## 🎯 Session de Revue Visuelle...",
      labels: ["bug"],
    });

    expect(res.success).toBe(true);
    expect(res.issueNumber).toBe(42);
    expect(res.issueUrl).toBe("https://github.com/StephanePadrao/PEPPER/issues/42");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/StephanePadrao/PEPPER/issues",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer ghp_mocktoken123456",
        }),
      })
    );
  });

  it("handles GitHub API error response gracefully", async () => {
    process.env.GITHUB_TOKEN = "ghp_mocktoken123456";

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        message: "Resource not accessible by personal access token",
      }),
    });

    const res = await createGitHubIssueAction({
      title: "fix(ui): unauthorized test",
      body: "Body",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Resource not accessible");
  });
});
