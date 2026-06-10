import { FeedList } from "@/components/feed/FeedList";
import { MonthlySpotlight } from "@/components/feed/MonthlySpotlight";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import Link from "next/link";

export default function FeedPage() {
  return (
    <div className="space-y-8">
      <section className="comic-hero p-6 md:p-8">
        <span className="comic-burst text-sm mb-4 inline-block">RPG Social Hub</span>
        <h1 className="font-comic text-3xl md:text-5xl leading-tight mt-3">
          BUILD WORLDS.
          <br />
          <span className="text-comic-yellow">SHARE STORIES.</span>
        </h1>
        <p className="mt-4 text-sm md:text-base opacity-90 max-w-lg leading-relaxed">
          Browse teasers from creators — like the back of a comic book.
          Free and premium posts appear here; sign up to unlock full content.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/signup">
            <Button variant="comic">
              <Plus className="h-4 w-4 mr-2" />
              Join free
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="comic-outline" className="text-white border-white hover:bg-white/10">
              <BookOpen className="h-4 w-4 mr-2" />
              Explore free works
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="comic-outline" className="text-white border-white hover:bg-white/10">
              Shop premium
            </Button>
          </Link>
        </div>
      </section>

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
