"use client"

import { useEffect, useState } from "react"
import { buildPlatformUrl } from "./attribution"

// React hook that returns a URL to the platform with UTM params attached.
// The first render returns a static fallback (no params) so that SSR/SSG output
// matches the client; after mount, the URL is rebuilt using inbound UTMs from
// localStorage. `<a>` elements using this hook will swap their href to the
// tracked URL once the client hydrates.
export function usePlatformUrl(ctaContent: string, path: string = "/"): string {
  const fallback = `https://app.strato.nexus${path.startsWith("/") ? path : `/${path}`}`
  const [url, setUrl] = useState<string>(fallback)
  useEffect(() => {
    setUrl(buildPlatformUrl(ctaContent, path))
  }, [ctaContent, path])
  return url
}
