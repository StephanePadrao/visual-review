import { toCanvas, toPng } from "html-to-image";
import type { VisualAnnotation } from "@/types/visual-review";

/**
 * Returns a circled unicode number (①, ②, ③...) or `(n)` if above 20.
 */
export function getCircledNumber(index: number): string {
  const circledDigits = [
    "①",
    "②",
    "③",
    "④",
    "⑤",
    "⑥",
    "⑦",
    "⑧",
    "⑨",
    "⑩",
    "⑪",
    "⑫",
    "⑬",
    "⑭",
    "⑮",
    "⑯",
    "⑰",
    "⑱",
    "⑲",
    "⑳",
  ];
  if (index >= 1 && index <= 20) {
    return circledDigits[index - 1];
  }
  return `(${index})`;
}

/**
 * Derives a human-friendly page name from pathname
 */
export function getPageNameFromPath(pathname: string): string {
  const clean = (pathname || "/").split("?")[0].replace(/\/+$/, "") || "/";

  if (clean === "/" || clean === "") return "Accueil";
  if (clean === "/login") return "Connexion";
  if (clean === "/todo") return "Todo Backlog";
  if (clean === "/privacy") return "Confidentialité";
  if (clean === "/terms") return "Conditions d'utilisation";
  if (clean.startsWith("/emails")) return "Templates d'Emails";

  if (clean.includes("/roadmap")) return "Roadmap";
  if (clean.includes("/backlog")) return "Backlog";
  if (clean.includes("/releases")) return "Releases";
  if (clean.includes("/settings")) return "Paramètres du Projet";
  if (clean.includes("/audit")) return "Audit Trail";
  if (clean.startsWith("/projects/")) return "Dashboard Projet";
  if (clean.startsWith("/workspaces/")) return "Workspace";

  // Fallback to capitalizing last segment
  const segments = clean.split("/").filter(Boolean);
  const last = segments[segments.length - 1] || "Page";
  return last.charAt(0).toUpperCase() + last.slice(1);
}

/**
 * Generates an intelligent default issue title:
 * `fix(ui): Corrections d'interface sur [Nom de la Page] (X points)`
 */
export function generateDefaultIssueTitle(pathname: string, annotationCount: number): string {
  const pageName = getPageNameFromPath(pathname);
  const pointsText = `${annotationCount} point${annotationCount > 1 ? "s" : ""}`;
  return `fix(ui): Corrections d'interface sur ${pageName} (${pointsText})`;
}

export interface ElementLike {
  id?: string;
  getAttribute?: (name: string) => string | null;
  tagName?: string;
  className?: string | { baseVal?: string };
  parentElement?: ElementLike | null;
  children?: ElementLike[] | HTMLCollectionOf<Element>;
  nodeType?: number;
}

/**
 * Computes a human-readable and specific CSS selector for a DOM element
 */
export function getElementSelector(element: ElementLike): string {
  if (!element || !element.tagName) return "inconnu";

  if (element.id) {
    return `#${element.id}`;
  }

  const testId = element.getAttribute?.("data-testid");
  if (testId) {
    return `[data-testid="${testId}"]`;
  }

  const path: string[] = [];
  let current: ElementLike | null | undefined = element;
  let depth = 0;

  while (current && current.tagName && depth < 4) {
    const tagName = current.tagName.toLowerCase();
    if (tagName === "body" || tagName === "html") break;

    if (current.id) {
      path.unshift(`#${current.id}`);
      break;
    }

    let selector = tagName;

    // Add key identification class if available
    const classNameStr =
      typeof current.className === "string" ? current.className : current.className?.baseVal || "";

    if (classNameStr) {
      const classes = classNameStr
        .split(/\s+/)
        .filter(
          (c: string) =>
            c &&
            !c.startsWith("hover:") &&
            !c.startsWith("focus:") &&
            !c.startsWith("dark:") &&
            !c.startsWith("transition-") &&
            !c.startsWith("duration-") &&
            !c.includes("/")
        );
      if (classes.length > 0) {
        selector += `.${classes.slice(0, 2).join(".")}`;
      }
    }

    // Add nth-child if has siblings
    if (current.parentElement?.children) {
      const siblings = Array.from(current.parentElement.children).filter(
        (c: ElementLike) => c.tagName === current?.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
    depth++;
  }

  return path.join(" > ") || element.tagName.toLowerCase();
}

/**
 * Extracts and cleans Tailwind / CSS classes from an element
 */
export function getTailwindClasses(element: { className?: string | { baseVal?: string } }): string {
  if (!element) return "";
  if (typeof element.className === "string") {
    return element.className.trim();
  }
  if (element.className?.baseVal) {
    return element.className.baseVal.trim();
  }
  return "";
}

/**
 * Formats a clean date in French locale
 */
export function formatReviewDate(date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 16).replace("T", " ");
  }
}

/**
 * Formats structured Markdown body for GitHub issue creation
 * Strictly obeys GitHub REST API 65,536-character max limit
 */
export function formatGitHubIssueBody(data: {
  annotations: VisualAnnotation[];
  url: string;
  pageTitle: string;
  screenResolution: string;
  createdAt?: string;
}): string {
  const { annotations, url, pageTitle, screenResolution, createdAt } = data;
  const dateFormatted = formatReviewDate(createdAt ? new Date(createdAt) : new Date());

  const pointsCount = annotations.length;
  const pointsLabel = `${pointsCount} point${pointsCount > 1 ? "s" : ""}`;

  let body = `## 🎯 Session de Revue Visuelle\n\n`;
  body += `> Revue d'interface générée automatiquement via **PEPPER DevTools**.\n\n`;
  body += `### 📋 Métadonnées de l'environnement\n`;
  body += `| Métadonnée | Valeur |\n`;
  body += `|---|---|\n`;
  body += `| **Page / URL** | \`${url}\` |\n`;
  body += `| **Titre de la page** | ${pageTitle || "PEPPER"} |\n`;
  body += `| **Résolution d'écran** | ${screenResolution || "Non spécifiée"} |\n`;
  body += `| **Date de session** | ${dateFormatted} |\n`;
  body += `| **Total annotations** | ${pointsLabel} |\n\n`;
  body += `---\n\n`;
  body += `## 🛠️ Points d'amélioration & Consignes de correction\n\n`;

  annotations.forEach((item) => {
    const circled = getCircledNumber(item.index);
    body += `### ${circled} Point ${item.index} : ${item.instruction || "Correction demandée"}\n\n`;
    body += `- **Composant cible** : \`<${item.tagName.toLowerCase()}${item.tailwindClasses ? ` class="${item.tailwindClasses}"` : ""}>\`\n`;
    body += `- **Sélecteur CSS** : \`${item.elementSelector}\`\n`;
    body += `- **Dimensions / Position** : \`${Math.round(item.rect.width)}×${Math.round(item.rect.height)}px\` à \`(${Math.round(item.rect.x)}, ${Math.round(item.rect.y)})\`\n`;
    body += `- **Consigne** :\n`;
    body += `  > ${item.instruction || "(Aucune consigne spécifiée)"}\n\n`;

    // Include snapshot thumbnail if available
    const snapshot = item.thumbnailDataUrl || item.imageDataUrl;
    if (snapshot && snapshot.startsWith("data:image/")) {
      body += `<details>\n<summary>📸 Voir la capture du composant (${circled})</summary>\n\n`;
      body += `<img src="${snapshot}" alt="Capture Point ${item.index}" width="480" />\n`;
      body += `</details>\n\n`;
    }

    body += `---\n\n`;
  });

  body += `*Généré automatiquement par l'inspecteur de revue visuelle [PEPPER](https://github.com/StephanePadrao/PEPPER)*\n`;

  // Check 60,000 character safety margin (GitHub limit is 65,536)
  if (body.length > 60000) {
    // If body exceeds limit, strip raw data-urls to prevent GitHub API rejection
    let fallbackBody = body.replace(
      /<details>[\s\S]*?<\/details>/g,
      `*(Capture disponible localement dans le prompt IA pour préserver la limite GitHub)*`
    );
    if (fallbackBody.length > 65000) {
      fallbackBody = fallbackBody.slice(0, 64500) + "\n\n*(Tronqué pour la limite GitHub)*";
    }
    return fallbackBody;
  }

  return body;
}

/**
 * Formats a clean, high-precision prompt ready to paste into an AI chat
 */
export function formatAIPrompt(data: {
  annotations: VisualAnnotation[];
  url: string;
  pageTitle: string;
  screenResolution: string;
}): string {
  const { annotations, url, pageTitle, screenResolution } = data;

  let prompt = `Agis en tant que développeur full-stack expert sur le projet PEPPER (Next.js 16, React 19, Tailwind CSS v4, TypeScript).\n`;
  prompt += `J'ai effectué une session de revue visuelle sur la page "${pageTitle || "PEPPER"}" (\`${url}\`).\n`;
  prompt += `Résolution d'écran : ${screenResolution}.\n\n`;
  prompt += `Voici les ${annotations.length} corrections et améliorations d'interface à apporter :\n\n`;

  annotations.forEach((item) => {
    const circled = getCircledNumber(item.index);
    prompt += `### ${circled} Point ${item.index} : ${item.instruction}\n`;
    prompt += `- **Composant cible** : \`<${item.tagName.toLowerCase()} class="${item.tailwindClasses}">\`\n`;
    prompt += `- **Sélecteur CSS** : \`${item.elementSelector}\`\n`;
    prompt += `- **Zone ciblée** : ${Math.round(item.rect.width)}x${Math.round(item.rect.height)}px\n`;
    prompt += `- **Consigne exacte** : ${item.instruction}\n\n`;
  });

  prompt += `Merci d'inspecter les composants correspondants dans la base de code et d'appliquer ces modifications avec précision en respectant les standards de PEPPER.`;

  return prompt;
}

/**
 * Compresses an image data URL to a small thumbnail JPEG to fit easily in GitHub issues
 */
export async function compressThumbnail(
  dataUrl: string,
  maxWidth = 400,
  quality = 0.7
): Promise<string> {
  if (typeof window === "undefined" || !dataUrl || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / Math.max(1, img.width));
        const targetWidth = Math.max(10, Math.round(img.width * scale));
        const targetHeight = Math.max(10, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Captures a high-definition snapshot of an element and generates both a full data URL
 * and an ultra-compact thumbnail data URL.
 */
export async function captureElementSnapshot(
  element: HTMLElement,
  customRect?: { x: number; y: number; width: number; height: number }
): Promise<{ fullDataUrl: string; thumbnailDataUrl: string }> {
  const fallbackSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-family="sans-serif" font-size="12">Capture ${element?.tagName?.toLowerCase() || "zone"}</text></svg>`;

  if (typeof window === "undefined" || !element) {
    return { fullDataUrl: fallbackSvg, thumbnailDataUrl: fallbackSvg };
  }

  try {
    const filter = (node: HTMLElement) => {
      if (!node) return true;
      if (node.hasAttribute && node.hasAttribute("data-devtools-ignore")) return false;
      return true;
    };

    let fullDataUrl = "";

    if (customRect && customRect.width > 5 && customRect.height > 5) {
      // Capture canvas and crop to customRect
      const rootCanvas = await toCanvas(document.body, {
        pixelRatio: 1.5,
        filter,
        cacheBust: true,
      });

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = customRect.width;
      croppedCanvas.height = customRect.height;
      const ctx = croppedCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          rootCanvas,
          customRect.x * 1.5,
          customRect.y * 1.5,
          customRect.width * 1.5,
          customRect.height * 1.5,
          0,
          0,
          customRect.width,
          customRect.height
        );
        fullDataUrl = croppedCanvas.toDataURL("image/png");
      } else {
        fullDataUrl = await toPng(element, { pixelRatio: 1.5, filter, cacheBust: true });
      }
    } else {
      fullDataUrl = await toPng(element, { pixelRatio: 1.5, filter, cacheBust: true });
    }

    const thumbnailDataUrl = await compressThumbnail(fullDataUrl, 380, 0.65);
    return { fullDataUrl, thumbnailDataUrl };
  } catch (err) {
    console.warn("Visual review snapshot capture error:", err);
    return { fullDataUrl: fallbackSvg, thumbnailDataUrl: fallbackSvg };
  }
}
