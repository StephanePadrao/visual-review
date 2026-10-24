"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useVisualReview } from "./visual-review-context";
import {
  getCircledNumber,
  getElementSelector,
  getTailwindClasses,
  captureElementSnapshot,
} from "@/lib/visual-review";
import { Button } from "@/components/ui/button";
import { Check, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisualAnnotation } from "@/types/visual-review";

interface RectCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function VisualReviewOverlay() {
  const {
    isActive,
    isDrawerOpen,
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    editingAnnotationId,
    setEditingAnnotationId,
  } = useVisualReview();

  const [hoverRect, setHoverRect] = useState<RectCoords | null>(null);
  const [hoverElement, setHoverElement] = useState<HTMLElement | null>(null);
  const [dragRect, setDragRect] = useState<RectCoords | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [, setScrollTick] = useState<number>(0);

  const isMouseDownRef = useRef<boolean>(false);
  const startPosRef = useRef<{
    clientX: number;
    clientY: number;
  } | null>(null);

  // Helper to test if a node belongs to devtools or overlay
  const isDevToolsNode = useCallback((node: Element | null): boolean => {
    if (!node) return false;
    return !!node.closest("[data-devtools-ignore='true']");
  }, []);

  // Sync element positions on window or container scroll
  useEffect(() => {
    if (!isActive) return;
    const handleScrollOrResize = () => {
      setScrollTick((prev) => prev + 1);
    };
    window.addEventListener("scroll", handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, { capture: true });
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isActive]);

  // Track hover when active, not dragging, and drawer is closed
  useEffect(() => {
    if (!isActive || isDrawerOpen) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isMouseDownRef.current && startPosRef.current) {
        // Dragging a selection rectangle in viewport coordinates
        const currentX = e.clientX;
        const currentY = e.clientY;
        const startX = startPosRef.current.clientX;
        const startY = startPosRef.current.clientY;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        setDragRect({ x: left, y: top, width, height });
        setHoverRect(null);
        return;
      }

      const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!target || isDevToolsNode(target)) {
        setHoverRect(null);
        setHoverElement(null);
        return;
      }

      const box = target.getBoundingClientRect();
      setHoverRect({
        x: box.left,
        y: box.top,
        width: box.width,
        height: box.height,
      });
      setHoverElement(target);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      setHoverRect(null);
      setHoverElement(null);
      setDragRect(null);
    };
  }, [isActive, isDrawerOpen, isDevToolsNode]);

  // Handle Mouse Down & Up for click or drag-and-drop selection
  useEffect(() => {
    if (!isActive || isDrawerOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement | null;
      if (isDevToolsNode(target)) return;

      isMouseDownRef.current = true;
      startPosRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
      };
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (!isMouseDownRef.current || !startPosRef.current) return;
      isMouseDownRef.current = false;

      const target = e.target as HTMLElement | null;
      if (isDevToolsNode(target)) {
        setDragRect(null);
        return;
      }

      const deltaX = Math.abs(e.clientX - startPosRef.current.clientX);
      const deltaY = Math.abs(e.clientY - startPosRef.current.clientY);
      const wasDragged = deltaX > 10 || deltaY > 10;

      let targetEl: HTMLElement | null = hoverElement;
      let finalRect: RectCoords;

      if (wasDragged && dragRect && dragRect.width > 10 && dragRect.height > 10) {
        finalRect = dragRect;
        const pointEl = document.elementFromPoint(
          startPosRef.current.clientX,
          startPosRef.current.clientY
        ) as HTMLElement | null;
        if (pointEl && !isDevToolsNode(pointEl)) {
          targetEl = pointEl;
        }
      } else if (hoverRect && hoverElement) {
        finalRect = hoverRect;
        targetEl = hoverElement;
      } else {
        const pointEl = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (pointEl && !isDevToolsNode(pointEl)) {
          targetEl = pointEl;
          const box = pointEl.getBoundingClientRect();
          finalRect = {
            x: box.left,
            y: box.top,
            width: box.width,
            height: box.height,
          };
        } else {
          setDragRect(null);
          return;
        }
      }

      if (!targetEl) {
        setDragRect(null);
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      setIsCapturing(true);

      try {
        const selector = getElementSelector(targetEl);
        const tailwindClasses = getTailwindClasses(targetEl);
        const tagName = targetEl.tagName || "DIV";
        const pageTitle = document.title || "PEPPER";
        const currentUrl =
          window.location.pathname + (window.location.search ? window.location.search : "");
        const resolution = `${window.innerWidth}x${window.innerHeight} (${window.screen.width}x${window.screen.height})`;

        const customCrop = wasDragged
          ? {
              x: finalRect.x,
              y: finalRect.y,
              width: finalRect.width,
              height: finalRect.height,
            }
          : undefined;

        const { fullDataUrl, thumbnailDataUrl } = await captureElementSnapshot(
          targetEl,
          customCrop
        );

        const newAnnotation = addAnnotation({
          id: `anno-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          instruction: "",
          elementSelector: selector,
          tagName,
          tailwindClasses,
          url: currentUrl,
          pageTitle,
          screenResolution: resolution,
          rect: {
            x: finalRect.x + window.scrollX,
            y: finalRect.y + window.scrollY,
            width: finalRect.width,
            height: finalRect.height,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
          },
          imageDataUrl: fullDataUrl,
          thumbnailDataUrl,
          createdAt: new Date().toISOString(),
        });

        setEditingAnnotationId(newAnnotation.id);
      } catch (err) {
        console.error("Error creating annotation:", err);
      } finally {
        setIsCapturing(false);
        setDragRect(null);
        startPosRef.current = null;
      }
    };

    window.addEventListener("mousedown", handleMouseDown, { capture: true });
    window.addEventListener("mouseup", handleMouseUp, { capture: true });

    return () => {
      window.removeEventListener("mousedown", handleMouseDown, { capture: true });
      window.removeEventListener("mouseup", handleMouseUp, { capture: true });
    };
  }, [
    isActive,
    isDrawerOpen,
    hoverElement,
    hoverRect,
    dragRect,
    addAnnotation,
    setEditingAnnotationId,
    isDevToolsNode,
  ]);

  // Resolves live viewport position of an annotation
  const getRenderBox = (anno: VisualAnnotation): RectCoords | null => {
    if (typeof document !== "undefined" && anno.elementSelector) {
      try {
        const el = document.querySelector(anno.elementSelector);
        if (el) {
          const b = el.getBoundingClientRect();
          // Hide if scrolled completely off viewport
          if (b.bottom < -20 || b.top > window.innerHeight + 20) {
            return null;
          }
          return {
            x: b.left,
            y: b.top,
            width: b.width,
            height: b.height,
          };
        }
      } catch {
        // Fallback
      }
    }

    const vx = anno.rect.x - (typeof window !== "undefined" ? window.scrollX : 0);
    const vy = anno.rect.y - (typeof window !== "undefined" ? window.scrollY : 0);
    const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    if (vy < -50 || vy > winHeight + 50) {
      return null;
    }

    return {
      x: vx,
      y: vy,
      width: anno.rect.width,
      height: anno.rect.height,
    };
  };

  if (!isActive) return null;

  return (
    <div
      data-devtools-ignore="true"
      className="pointer-events-none fixed inset-0 z-[9980] overflow-visible"
    >
      {/* 1. Hover Halo Highlight (disabled when drawer is open) */}
      {!isDrawerOpen && hoverRect && !dragRect && (
        <div
          style={{
            position: "absolute",
            left: `${hoverRect.x}px`,
            top: `${hoverRect.y}px`,
            width: `${Math.max(10, hoverRect.width)}px`,
            height: `${Math.max(10, hoverRect.height)}px`,
          }}
          className="pointer-events-none rounded-sm border-2 border-dashed border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-75"
        >
          <div className="absolute -top-5 left-0 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-mono text-white shadow-xs">
            {hoverElement?.tagName?.toLowerCase() || "element"}
          </div>
        </div>
      )}

      {/* 2. Dragging Selection Box */}
      {!isDrawerOpen && dragRect && (
        <div
          style={{
            position: "absolute",
            left: `${dragRect.x}px`,
            top: `${dragRect.y}px`,
            width: `${dragRect.width}px`,
            height: `${dragRect.height}px`,
          }}
          className="pointer-events-none rounded-sm border-2 border-dashed border-primary bg-primary/15 shadow-[0_0_20px_rgba(244,63,94,0.35)]"
        >
          <div className="absolute -top-5 left-0 rounded bg-primary px-1.5 py-0.5 text-[10px] font-mono text-white shadow-xs">
            {Math.round(dragRect.width)} × {Math.round(dragRect.height)}px
          </div>
        </div>
      )}

      {/* 3. Capturing Indicator */}
      {isCapturing && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 rounded-full border border-blue-500/40 bg-background/95 px-4 py-2 text-xs font-semibold text-blue-600 shadow-xl backdrop-blur-md">
          <Loader2 className="size-4 animate-spin" />
          <span>Capture du composant en cours...</span>
        </div>
      )}

      {/* 4. Persistent Annotations Rectangles & Numbered Pins */}
      {annotations.map((anno) => {
        const renderBox = getRenderBox(anno);
        if (!renderBox) return null;

        const isEditing = editingAnnotationId === anno.id && !isDrawerOpen;
        const circled = getCircledNumber(anno.index);

        // Clamped popover position to stay within visible screen
        const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
        const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;
        const popoverLeft = Math.min(winWidth - 340, Math.max(16, renderBox.x));
        const popoverTop = Math.min(winHeight - 220, Math.max(16, renderBox.y + 34));

        return (
          <React.Fragment key={anno.id}>
            {/* Dashed Bounding Border */}
            <div
              style={{
                position: "absolute",
                left: `${renderBox.x}px`,
                top: `${renderBox.y}px`,
                width: `${Math.max(12, renderBox.width)}px`,
                height: `${Math.max(12, renderBox.height)}px`,
              }}
              className={cn(
                "pointer-events-none rounded-sm border-2 border-dashed transition-all",
                isEditing
                  ? "border-blue-600 bg-blue-600/15 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  : "border-blue-500/80 bg-blue-500/5 shadow-xs"
              )}
            />

            {/* Pastille Numérotée (Pinned Badge: ①, ②, ③...) */}
            <div
              style={{
                position: "absolute",
                left: `${renderBox.x - 12}px`,
                top: `${renderBox.y - 12}px`,
              }}
              className={cn(
                "z-[9985]",
                isDrawerOpen ? "pointer-events-none opacity-60" : "pointer-events-auto"
              )}
            >
              <button
                type="button"
                onClick={() => setEditingAnnotationId(anno.id)}
                disabled={isDrawerOpen}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer ring-2 ring-background",
                  isEditing
                    ? "bg-gradient-to-tr from-blue-700 to-indigo-600 ring-blue-400 scale-110"
                    : "bg-gradient-to-tr from-blue-600 to-blue-500"
                )}
                title={`Point ${circled} : ${anno.instruction || "Cliquez pour éditer"}`}
              >
                {circled}
              </button>

              {/* Mini Popover de saisie de consigne (clamped and dismissed when drawer is open) */}
              {isEditing && (
                <div
                  data-devtools-ignore="true"
                  style={{
                    position: "fixed",
                    top: `${popoverTop}px`,
                    left: `${popoverLeft}px`,
                  }}
                  className="pointer-events-auto z-[9995] w-80 rounded-xl border border-border/80 bg-background/98 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 dark:ring-white/10"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                        {circled}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        Annotation #{anno.index}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAnnotation(anno.id)}
                        title="Supprimer cette annotation"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAnnotationId(null)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] font-mono text-muted-foreground truncate bg-muted/60 px-2 py-1 rounded">
                      &lt;{anno.tagName.toLowerCase()}&gt; • {anno.elementSelector}
                    </div>

                    <textarea
                      autoFocus
                      rows={3}
                      placeholder="Ex: Élargir la colonne à 320px, La ligne verte chevauche l'indicateur d'aujourd'hui..."
                      value={anno.instruction}
                      onChange={(e) => updateAnnotation(anno.id, { instruction: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          setEditingAnnotationId(null);
                        }
                      }}
                      className="w-full resize-none rounded-lg border border-input bg-background/90 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground">Entrée pour valider</span>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setEditingAnnotationId(null)}
                        className="h-7 gap-1 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 cursor-pointer shadow-xs"
                      >
                        <Check className="size-3" />
                        <span>Enregistrer</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
