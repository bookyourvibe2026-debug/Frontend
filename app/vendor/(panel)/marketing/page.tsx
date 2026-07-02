import { Megaphone, Percent, Share2 } from "lucide-react";
import { PageHero, SectionCard } from "@/components/vendor/ui";

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Grow"
        title="Marketing"
        description="Promote your listings, run discounts, and get more bookings for your turfs, games & events."
      />

      <div className="grid sm:grid-cols-3 gap-5">
        <SectionCard title="Promo Codes" description="Create discount codes for a listing or your whole profile.">
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-vibe-violet text-white text-sm font-semibold py-2.5 hover:bg-vibe-violetSoft">
            <Percent size={16} /> Create Promo Code
          </button>
        </SectionCard>
        <SectionCard title="Featured Placement" description="Boost visibility on the homepage and search results.">
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-surface-border text-ink-soft text-sm font-semibold py-2.5 hover:bg-cream-300">
            <Megaphone size={16} /> Request Feature
          </button>
        </SectionCard>
        <SectionCard title="Share Listings" description="Get shareable links for Instagram, WhatsApp & more.">
          <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-surface-border text-ink-soft text-sm font-semibold py-2.5 hover:bg-cream-300">
            <Share2 size={16} /> Get Share Links
          </button>
        </SectionCard>
      </div>
    </div>
  );
}
