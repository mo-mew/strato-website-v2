"use client"

import { useEffect } from "react"
import { captureInboundAttribution } from "@/lib/attribution"

// Mounted once at the root layout; captures any utm_* params present on the
// landing URL into localStorage so they can be forwarded onto outbound links
// to the platform via buildPlatformUrl().
export function AttributionTracker() {
  useEffect(() => {
    captureInboundAttribution()
  }, [])
  return null
}
