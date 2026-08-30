"use client";

import { ConvexProvider } from "convex/react";
import { convexClient, isConvexConfigured } from "@/lib/convex";

/** Mounts the Convex provider only when a deployment URL is configured. */
export function ConvexProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isConvexConfigured || !convexClient) {
    return <>{children}</>;
  }
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}
