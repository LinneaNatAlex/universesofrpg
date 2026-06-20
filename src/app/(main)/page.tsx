import { FeedHero } from "@/components/feed/FeedHero";
import { FeedList } from "@/components/feed/FeedList";
import { HomepageChat } from "@/components/feed/HomepageChat";
import { MonthlySpotlight } from "@/components/feed/MonthlySpotlight";

export default function FeedPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <FeedHero />

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-stretch">
        <div className="min-w-0 flex-1">
          <MonthlySpotlight />
        </div>
        <aside className="w-full lg:w-[42%] xl:max-w-[480px] lg:shrink-0 flex flex-col min-h-[min(320px,50vh)] max-h-[min(380px,55vh)] lg:min-h-0 lg:max-h-none">
          <HomepageChat className="h-full flex-1 min-h-0" />
        </aside>
      </div>

      <section>
        <div className="flex flex-col gap-1 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-comic text-xl sm:text-2xl text-ink">Latest from the realm</h2>
          <span className="text-xs font-comic text-ink-muted uppercase">Up to 10 newest · teasers</span>
        </div>
        <FeedList limit={10} />
      </section>
    </div>
  );
}
