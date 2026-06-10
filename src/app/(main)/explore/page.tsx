import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const TAGS = [
  "fantasy", "sci-fi", "horror", "romance", "cyberpunk", "anime",
  "modern", "mystical", "collab", "character", "profile", "story",
];

export default function ExplorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="text-muted mt-1">
          Discover creators, tags, and RPG styles across the realm.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Popular tags</h2>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <Badge key={tag} variant="tag" className="cursor-pointer hover:border-violet-500/50">
              #{tag}
            </Badge>
          ))}
        </div>
      </Card>

      <p className="text-sm text-muted text-center py-8">
        Full explore & search — coming in Phase 2 after Supabase is connected.
      </p>
    </div>
  );
}
