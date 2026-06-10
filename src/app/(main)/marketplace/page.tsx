import { FeedCard } from "@/components/feed/FeedCard";
import { Badge } from "@/components/ui/badge";
import { MOCK_FEED } from "@/lib/mock-data";
import { Filter } from "lucide-react";

const FILTERS = ["All", "Free", "Paid", "Fantasy", "Sci-fi", "Horror", "Anime"];

export default function MarketplacePage() {
  const items = MOCK_FEED;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">RPG Marketplace</h1>
        <p className="text-muted mt-1">
          Character packs, profile themes, storylines, and world kits.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted" />
        {FILTERS.map((f, i) => (
          <Badge key={f} variant={i === 0 ? "default" : "tag"}>
            {f}
          </Badge>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((post) => (
          <FeedCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
