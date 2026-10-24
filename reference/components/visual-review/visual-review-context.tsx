"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { VisualAnnotation, IssueLabelType } from "@/types/visual-review";
import { generateDefaultIssueTitle } from "@/lib/visual-review";

export interface ToastState {
  message: string;
  type: "success" | "error";
  linkUrl?: string;
}

export interface VisualReviewContextType {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  toggleActive: () => void;
  annotations: VisualAnnotation[];
  addAnnotation: (annotation: Omit<VisualAnnotation, "index">) => VisualAnnotation;
  updateAnnotation: (id: string, updates: Partial<VisualAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  clearSession: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  editingAnnotationId: string | null;
  setEditingAnnotationId: (id: string | null) => void;
  issueTitle: string;
  setIssueTitle: (title: string) => void;
  issueLabel: IssueLabelType;
  setIssueLabel: (label: IssueLabelType) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: "success" | "error", linkUrl?: string) => void;
  closeToast: () => void;
}

const VisualReviewContext = createContext<VisualReviewContextType | null>(null);

export function VisualReviewProvider({
  children,
  initialToast,
}: {
  children: React.ReactNode;
  initialToast?: ToastState | null;
}) {
  const pathname = usePathname();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [issueLabel, setIssueLabel] = useState<IssueLabelType>("bug");
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(initialToast || null);

  // Derive title from pathname & count, or use user's custom title
  const issueTitle = useMemo(() => {
    if (customTitle !== null) return customTitle;
    return generateDefaultIssueTitle(pathname || "/", annotations.length);
  }, [pathname, annotations.length, customTitle]);

  const handleSetIssueTitle = useCallback((title: string) => {
    setCustomTitle(title);
  }, []);

  const toggleActive = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const handleSetIsDrawerOpen = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
    if (open) {
      setEditingAnnotationId(null);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success", linkUrl?: string) => {
      setToast({ message, type, linkUrl });
    },
    []
  );

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  // Auto-dismiss toast after 7 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Re-index helper
  const reindex = (list: VisualAnnotation[]): VisualAnnotation[] =>
    list.map((item, idx) => ({ ...item, index: idx + 1 }));

  const addAnnotation = useCallback((data: Omit<VisualAnnotation, "index">): VisualAnnotation => {
    let createdItem: VisualAnnotation | null = null;
    setAnnotations((prev) => {
      const newItem: VisualAnnotation = {
        ...data,
        index: prev.length + 1,
      };
      createdItem = newItem;
      return [...prev, newItem];
    });
    setEditingAnnotationId(data.id);
    return createdItem!;
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<VisualAnnotation>) => {
    setAnnotations((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      return reindex(filtered);
    });
    setEditingAnnotationId((current) => (current === id ? null : current));
  }, []);

  const clearSession = useCallback(() => {
    setAnnotations([]);
    setEditingAnnotationId(null);
    setCustomTitle(null);
  }, []);

  // Global Keyboard shortcut: Cmd+Shift+R or Ctrl+Shift+R to toggle review mode
  // Escape to close active editing or drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac =
        typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        toggleActive();
        return;
      }

      if (e.key === "Escape") {
        if (editingAnnotationId) {
          setEditingAnnotationId(null);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleActive, editingAnnotationId, isDrawerOpen]);

  const value = useMemo(
    () => ({
      isActive,
      setIsActive,
      toggleActive,
      annotations,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      clearSession,
      isDrawerOpen,
      setIsDrawerOpen: handleSetIsDrawerOpen,
      editingAnnotationId,
      setEditingAnnotationId,
      issueTitle,
      setIssueTitle: handleSetIssueTitle,
      issueLabel,
      setIssueLabel,
      toast,
      showToast,
      closeToast,
    }),
    [
      isActive,
      toggleActive,
      annotations,
      addAnnotation,
      updateAnnotation,
      deleteAnnotation,
      clearSession,
      isDrawerOpen,
      handleSetIsDrawerOpen,
      editingAnnotationId,
      issueTitle,
      handleSetIssueTitle,
      issueLabel,
      toast,
      showToast,
      closeToast,
    ]
  );

  return <VisualReviewContext.Provider value={value}>{children}</VisualReviewContext.Provider>;
}

export function useVisualReview() {
  const context = useContext(VisualReviewContext);
  if (!context) {
    throw new Error("useVisualReview must be used within a VisualReviewProvider");
  }
  return context;
}
