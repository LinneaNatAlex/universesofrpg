import { FeedHero } from "@/components/feed/FeedHero";
import { FeedList } from "@/components/feed/FeedList";
import { MonthlySpotlight } from "@/components/feed/MonthlySpotlight";

export default function FeedPage() {
  return (
    <div className="space-y-8">
      <FeedHero />

      <MonthlySpotlight />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-comic text-2xl text-ink">Latest from the realm</h2>
          <span className="text-xs font-comic text-ink-muted uppercase">Up to 10 newest · teasers</span>
        </div>
        <FeedList limit={10} />
      </section>
    </div>
  );
}
