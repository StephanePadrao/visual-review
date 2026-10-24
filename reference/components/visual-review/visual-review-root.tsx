"use client";

import React from "react";
import { VisualReviewProvider } from "./visual-review-context";
import { VisualReviewOverlay } from "./visual-review-overlay";
import { VisualReviewToolbar } from "./visual-review-toolbar";
import { VisualReviewDrawer } from "./visual-review-drawer";
import { VisualReviewToast } from "./visual-review-toast";

export function VisualReviewRoot() {
  return (
    <VisualReviewProvider>
      <VisualReviewOverlay />
      <VisualReviewToolbar />
      <VisualReviewDrawer />
      <VisualReviewToast />
    </VisualReviewProvider>
  );
}
