import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FeedCard } from "@/components/feed/FeedCard";
import { MOCK_FEED } from "@/lib/mock-data";
import { Shield, Sparkles } from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = MOCK_FEED[0].author;
  const creations = MOCK_FEED.filter((p) => p.author.username === profile.username);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden" glow>
        <div className="h-32 bg-gradient-to-r from-violet-900/60 via-background to-cyan-900/40" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-violet-500/50 bg-gradient-to-br from-violet-700 to-cyan-600 text-2xl font-bold shadow-glow">
              {profile.display_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                {profile.is_verified_creator && (
                  <span aria-label="Verified creator">
                    <Shield className="h-5 w-5 text-cyan-400" />
                  </span>
                )}
              </div>
              <p className="text-muted">@{username}</p>
            </div>
          </div>
          {profile.bio && <p className="mt-4 text-muted max-w-lg">{profile.bio}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="default">
              <Sparkles className="h-3 w-3 mr-1 inline" />
              RPG Persona
            </Badge>
            <Badge variant="tag">About</Badge>
            <Badge variant="tag">Creations</Badge>
            <Badge variant="tag">Shop</Badge>
            <Badge variant="tag">Stories</Badge>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="text-lg font-semibold mb-4">Creations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {creations.length > 0 ? (
            creations.map((post) => <FeedCard key={post.id} post={post} />)
          ) : (
            <p className="text-muted">No creations yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
