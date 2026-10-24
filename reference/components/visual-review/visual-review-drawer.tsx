/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useTransition } from "react";
import { useVisualReview } from "./visual-review-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatGitHubIssueBody, formatAIPrompt, getCircledNumber } from "@/lib/visual-review";
import { createGitHubIssueAction } from "@/app/devtools/actions";
import {
  Layers,
  Trash2,
  Rocket,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  Maximize2,
  X,
} from "lucide-react";

export function VisualReviewDrawer() {
  const {
    isDrawerOpen,
    setIsDrawerOpen,
    annotations,
    updateAnnotation,
    deleteAnnotation,
    clearSession,
    setIsActive,
    issueTitle,
    setIssueTitle,
    issueLabel,
    setIssueLabel,
    showToast,
  } = useVisualReview();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleCopyPrompt = async () => {
    try {
      const url =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      const pageTitle = typeof document !== "undefined" ? document.title : "PEPPER";
      const screenResolution =
        typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "1512x982";

      const prompt = formatAIPrompt({
        annotations,
        url,
        pageTitle,
        screenResolution,
      });

      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch (err) {
      console.error("Failed to copy prompt to clipboard:", err);
    }
  };

  const handleCreateGitHubTicket = () => {
    setError(null);

    if (annotations.length === 0) {
      setError("Veuillez ajouter au moins une annotation avant de créer le ticket.");
      return;
    }

    if (!issueTitle.trim()) {
      setError("Veuillez saisir un titre pour le ticket GitHub.");
      return;
    }

    startTransition(async () => {
      try {
        const url =
          typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
        const pageTitle = typeof document !== "undefined" ? document.title : "PEPPER";
        const screenResolution =
          typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "1512x982";

        const markdownBody = formatGitHubIssueBody({
          annotations,
          url,
          pageTitle,
          screenResolution,
          createdAt: new Date().toISOString(),
        });

        const res = await createGitHubIssueAction({
          title: issueTitle.trim(),
          body: markdownBody,
          labels: [issueLabel],
        });

        if (!res.success) {
          setError(res.error || "Une erreur est survenue lors de la création du ticket.");
          return;
        }

        // Issue created successfully!
        // Requirement E: Nettoyage Automatique (Reset)
        // Les pastilles disparaissent, le state local est remis à zéro, toast de confirmation
        clearSession();
        setIsDrawerOpen(false);
        setIsActive(false);

        showToast(
          `Ticket #${res.issueNumber} créé avec succès sur GitHub ! Session réinitialisée.`,
          "success",
          res.issueUrl
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur inattendue";
        setError(`Échec : ${message}`);
      }
    });
  };

  return (
    <>
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent
          data-devtools-ignore="true"
          side="right"
          overlayClassName="z-[9995]"
          className="z-[10000] flex flex-col w-full sm:max-w-xl md:max-w-2xl p-0 gap-0 border-l border-border/80 shadow-2xl bg-background/98 backdrop-blur-xl"
        >
          {/* Header */}
          <SheetHeader className="p-5 border-b border-border/60 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                  <Layers className="size-5" />
                </div>
                <div>
                  <SheetTitle className="text-sm font-bold tracking-tight">
                    Session de Revue Visuelle
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <span>
                      {annotations.length} annotation{annotations.length > 1 ? "s" : ""}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-[11px] truncate max-w-[250px]">
                      {typeof window !== "undefined" ? window.location.pathname : "/"}
                    </span>
                  </SheetDescription>
                </div>
              </div>

              {annotations.length > 0 && (
                <div className="flex items-center mr-8">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSession}
                    className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="size-3" />
                    <span>Vider</span>
                  </Button>
                </div>
              )}
            </div>
          </SheetHeader>

          {/* Form & List Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 text-xs text-destructive bg-destructive/10 rounded-lg border border-destructive/20 animate-in fade-in duration-200">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {/* Ticket Configuration */}
            <div className="rounded-xl border border-border/60 bg-muted/10 p-3.5 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="issue-title" className="text-xs font-semibold">
                  Titre du ticket GitHub
                </Label>
                <Input
                  id="issue-title"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder="fix(ui): Corrections d'interface sur..."
                  className="h-8 text-xs font-medium"
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Tag className="size-3.5" />
                  <span>Label GitHub :</span>
                </Label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIssueLabel("bug")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                      issueLabel === "bug"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    bug
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueLabel("enhancement")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                      issueLabel === "enhancement"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-semibold"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    enhancement
                  </button>
                </div>
              </div>
            </div>

            {/* Annotations List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Annotations posées ({annotations.length})
                </h3>
              </div>

              {annotations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground space-y-2">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted mx-auto text-muted-foreground">
                    <Layers className="size-5" />
                  </div>
                  <p className="font-medium text-foreground">Aucune annotation pour le moment</p>
                  <p className="text-[11px] max-w-sm mx-auto">
                    Activez le Mode Revue puis survolez et cliquez sur les composants ou tracez une
                    zone rectangulaire à la souris pour ajouter des consignes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {annotations.map((anno) => {
                    const circled = getCircledNumber(anno.index);
                    const thumbnail = anno.thumbnailDataUrl || anno.imageDataUrl;

                    return (
                      <div
                        key={anno.id}
                        className="group relative rounded-xl border border-border/70 bg-card p-3 shadow-xs transition-all hover:border-blue-500/50 hover:shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          {/* Miniature */}
                          {thumbnail && (
                            <div className="relative shrink-0 size-16 rounded-lg overflow-hidden border border-border bg-muted/40">
                              <img
                                src={thumbnail}
                                alt={`Snapshot ${anno.index}`}
                                className="size-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewImage(anno.imageDataUrl || thumbnail)}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                                title="Agrandir la capture"
                              >
                                <Maximize2 className="size-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Content */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                                  {circled}
                                </span>
                                <span className="font-mono text-[11px] font-semibold text-foreground truncate">
                                  &lt;{anno.tagName.toLowerCase()}&gt;
                                </span>
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAnnotation(anno.id)}
                                title="Supprimer cette annotation"
                                className="size-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            </div>

                            <div className="font-mono text-[10px] text-muted-foreground truncate">
                              {anno.elementSelector}
                            </div>

                            {/* Consigne textarea */}
                            <textarea
                              rows={2}
                              value={anno.instruction}
                              onChange={(e) =>
                                updateAnnotation(anno.id, { instruction: e.target.value })
                              }
                              placeholder="Consigne de modification..."
                              className="w-full resize-none rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <SheetFooter className="p-4 border-t border-border/60 bg-muted/20 flex flex-col gap-2 sm:flex-col">
            <div className="flex items-center gap-2 w-full">
              {/* Copy AI Prompt Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
                disabled={annotations.length === 0}
                className="flex-1 h-9 text-xs gap-1.5 rounded-xl border-border hover:bg-muted cursor-pointer"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Prompt IA Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 text-muted-foreground" />
                    <span>Copier le Prompt IA</span>
                  </>
                )}
              </Button>

              {/* Create GitHub Ticket Button */}
              <Button
                type="button"
                size="sm"
                onClick={handleCreateGitHubTicket}
                disabled={isPending || annotations.length === 0}
                className="flex-1 h-9 text-xs gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-white shadow-md cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Création du Ticket...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="size-3.5" />
                    <span>Créer le Ticket GitHub</span>
                  </>
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div
          data-devtools-ignore="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] rounded-xl overflow-hidden border border-white/20 bg-background shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="size-4" />
            </button>
            <img
              src={previewImage}
              alt="Capture HD"
              className="max-h-[80vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
