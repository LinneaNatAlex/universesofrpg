import { FeedHero } from "@/components/feed/FeedHero";
import { FeedList } from "@/components/feed/FeedList";
import { HomepageChat } from "@/components/feed/HomepageChat";
import { MonthlySpotlight } from "@/components/feed/MonthlySpotlight";

export default function FeedPage() {
  return (
    <div className="space-y-8">
      <FeedHero />

      <div className="flex flex-row gap-4 sm:gap-6 items-stretch">
        <div className="min-w-0 flex-1">
          <MonthlySpotlight />
        </div>
        <aside className="w-[50%] max-w-[480px] min-w-[320px] shrink-0 flex flex-col">
          <HomepageChat className="h-full flex-1" />
        </aside>
      </div>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
          <h2 className="font-comic text-2xl text-ink">Latest from the realm</h2>
          <span className="text-xs font-comic text-ink-muted uppercase">Up to 10 newest · teasers</span>
        </div>
        <FeedList limit={10} />
      </section>
    </div>
  );
}
