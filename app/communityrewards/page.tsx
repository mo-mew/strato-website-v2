import type { Metadata } from "next"
import { CommunityRewardsPageContent } from "@/components/community-rewards-page-content"

export const metadata: Metadata = {
  title: "Community Partnership",
  description:
    "Bridge your token to STRATO. Your holders earn 2x Reward Points during Season 2, and your token benefits from reduced sell pressure and organic buying pressure.",
  alternates: {
    canonical: "/communityrewards",
  },
}

export default function CommunityRewardsPage() {
  return <CommunityRewardsPageContent />
}
