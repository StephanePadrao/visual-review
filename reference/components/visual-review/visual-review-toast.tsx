"use client";

import React from "react";
import { useVisualReview } from "./visual-review-context";
import { CheckCircle2, AlertCircle, ExternalLink, X } from "lucide-react";

export function VisualReviewToast() {
  const { toast, closeToast } = useVisualReview();

  if (!toast) return null;

  const isSuccess = toast.type === "success";

  return (
    <div
      data-devtools-ignore="true"
      className="fixed bottom-6 left-6 z-[99999] flex max-w-md items-center gap-3 rounded-2xl border border-border/80 bg-background/98 p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200 ring-1 ring-black/5 dark:ring-white/10"
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          isSuccess
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
        }`}
      >
        {isSuccess ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xs font-semibold text-foreground leading-tight">{toast.message}</p>

        {toast.linkUrl && (
          <a
            href={toast.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
          >
            <span>Voir le ticket sur GitHub</span>
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={closeToast}
        className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
        aria-label="Fermer la notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
