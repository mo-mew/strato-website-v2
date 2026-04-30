// Strato.nexus acts as a UTM forwarder: when a user lands here from a partner
// (e.g. airdrop.io with ?utm_source=airdrop_io&...), we capture the inbound
// UTMs in localStorage and re-emit them on outbound links to the platform so
// the original source survives the multi-hop journey. The platform's GA4 then
// records `signup_completed` with the correct first-touch source and a `via`
// param indicating the user passed through strato.nexus.

const STORAGE_KEY = "inbound_attribution";
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const PLATFORM_ORIGIN = "https://app.strato.nexus";

interface InboundAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  captured_at: number;
}

// Capture inbound utm_* params on landing. First-touch wins.
export function captureInboundAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
    const captured: Partial<InboundAttribution> = {};
    let hasAny = false;
    for (const key of keys) {
      const value = params.get(key);
      if (value) {
        captured[key] = value;
        hasAny = true;
      }
    }
    if (!hasAny) return;
    if (readInboundAttribution()) return; // first-touch wins
    const record: InboundAttribution = { ...captured, captured_at: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore
  }
}

function readInboundAttribution(): InboundAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as InboundAttribution;
    if (!parsed.captured_at || Date.now() - parsed.captured_at > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// Build a URL to the platform with UTM params attached. Preserves the original
// inbound source if present; otherwise tags strato.nexus as the source.
//
// `ctaContent` identifies which button/link the user clicked, e.g. "hero-cta".
// `path` defaults to "/" but can be set to a deep link like "/dashboard/deposits".
export function buildPlatformUrl(ctaContent: string, path: string = "/"): string {
  const inbound = readInboundAttribution();
  const params = new URLSearchParams({
    utm_source: inbound?.utm_source ?? "strato_nexus",
    utm_medium: inbound?.utm_medium ?? "referral",
    utm_campaign: inbound?.utm_campaign ?? "direct",
    utm_content: ctaContent,
  });
  if (inbound?.utm_source) params.set("via", "strato_nexus");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${PLATFORM_ORIGIN}${normalizedPath}?${params.toString()}`;
}
