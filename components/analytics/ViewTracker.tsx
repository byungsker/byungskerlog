"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  slug: string;
}

const inFlightViewRequests = new Map<string, Promise<void>>();
const completedViewSlugs = new Set<string>();

function recordView(slug: string): void {
  if (completedViewSlugs.has(slug)) {
    return;
  }

  const existingRequest = inFlightViewRequests.get(slug);
  if (existingRequest) {
    return;
  }

  const request = fetch(`/api/posts-by-slug/${slug}/views`, {
    method: "POST",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`View tracking failed with status ${response.status}`);
      }

      completedViewSlugs.add(slug);
    })
    .catch((error) => {
      console.error("Failed to record view:", error);
    })
    .finally(() => {
      inFlightViewRequests.delete(slug);
    });

  inFlightViewRequests.set(slug, request);
}

export function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    recordView(slug);
  }, [slug]);

  return null;
}
