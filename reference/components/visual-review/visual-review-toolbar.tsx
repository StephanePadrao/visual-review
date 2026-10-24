"use client";

import React from "react";
import { useVisualReview } from "./visual-review-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Crosshair, Layers, Trash2, X, Keyboard } from "lucide-react";

export function VisualReviewToolbar() {
  const {
    isActive,
    toggleActive,
    setIsActive,
    annotations,
    isDrawerOpen,
    setIsDrawerOpen,
    clearSession,
  } = useVisualReview();

  // Hide the floating toolbar completely when the drawer is open to prevent overlapping with drawer footer
  if (isDrawerOpen) {
    return null;
  }

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
  const shortcutLabel = isMac ? "⌘+Shift+R" : "Ctrl+Shift+R";

  // Navigation mode: Discrete floating button at bottom-right
  if (!isActive) {
    return (
      <aside
        data-devtools-ignore="true"
        aria-label="Contrôles du mode revue visuelle"
        className="fixed bottom-5 right-5 z-[9990] flex items-center gap-2"
      >
        <button
          type="button"
          onClick={toggleActive}
          className={cn(
            "group relative flex items-center gap-2 rounded-full border border-blue-500/30 bg-background/95 px-3.5 py-2 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-blue-500/10 dark:hover:bg-blue-950/40 cursor-pointer"
          )}
          title={`Activer le Mode Revue Visuelle (${shortcutLabel})`}
        >
          <div className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-white transition-transform group-hover:scale-110">
            <Crosshair className="size-3" />
          </div>
          <span className="hidden sm:inline font-semibold">Mode Revue</span>
          {annotations.length > 0 && (
            <Badge
              variant="default"
              className="size-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-blue-600 text-white"
            >
              {annotations.length}
            </Badge>
          )}
        </button>
      </aside>
    );
  }

  // Active Review mode: Floating toolbar dock at bottom of the page
  return (
    <aside
      data-devtools-ignore="true"
      aria-label="Barre d'outils du mode revue visuelle active"
      className="fixed bottom-5 right-5 z-[9990] flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="flex items-center gap-2 rounded-2xl border border-blue-500/40 bg-background/95 p-1.5 shadow-2xl backdrop-blur-lg ring-1 ring-blue-500/20">
        {/* Dynamic Badge Counter */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <div className="size-2 rounded-full bg-blue-600 animate-pulse" />
          <span>🎯 Mode Revue ({annotations.length})</span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Switch Mode: Navigation vs Revue */}
        <div className="flex items-center rounded-xl bg-muted/60 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setIsActive(false)}
            className="rounded-lg px-2.5 py-1 text-muted-foreground transition-all hover:text-foreground cursor-pointer"
          >
            Navigation
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-2.5 py-1 font-semibold text-white shadow-xs"
          >
            Revue
          </button>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* Open Drawer / Summary */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsDrawerOpen(true)}
          className="relative h-8 gap-1.5 rounded-xl border-blue-500/30 text-xs font-medium hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 cursor-pointer"
        >
          <Layers className="size-3.5 text-blue-600 dark:text-blue-400" />
          <span>Session ({annotations.length})</span>
          {annotations.length > 0 && <span className="flex size-2 rounded-full bg-blue-600" />}
        </Button>

        {/* Clear annotations button */}
        {annotations.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSession}
            title="Effacer toutes les annotations de la page"
            className="h-8 size-8 rounded-xl p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span className="sr-only">Effacer les annotations</span>
          </Button>
        )}

        {/* Exit / Close */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsActive(false)}
          title="Quitter le mode revue (Échap)"
          className="h-8 size-8 rounded-xl p-0 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="size-4" />
          <span className="sr-only">Fermer</span>
        </Button>
      </div>

      {/* Discrete Hint Bubble */}
      <div className="flex items-center gap-1.5 rounded-lg bg-background/80 px-2.5 py-0.5 text-[10px] text-muted-foreground shadow-xs border border-border/50 backdrop-blur-xs">
        <Keyboard className="size-3" />
        <span>Survolez un composant ou tracez une zone • {shortcutLabel}</span>
      </div>
    </aside>
  );
}
