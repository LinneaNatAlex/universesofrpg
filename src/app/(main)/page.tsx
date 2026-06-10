import { FeedCard } from "@/components/feed/FeedCard";
import { Button } from "@/components/ui/button";
import { MOCK_FEED } from "@/lib/mock-data";
import { Sparkles, Plus } from "lucide-react";
import Link from "next/link";

export default function FeedPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/80 via-background to-cyan-950/40 p-8 shadow-glow">
        <div className="relative z-10 max-w-xl">
          <div className="flex items-center gap-2 text-violet-300 text-sm mb-3">
            <Sparkles className="h-4 w-4" />
            RPG Social Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Build identities. Forge worlds.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
              Share the magic.
            </span>
          </h1>
          <p className="mt-3 text-muted leading-relaxed">
            Publish character sheets, coded profile themes, story segments, and
            marketplace creations — free or paid.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/editor">
              <Button variant="glow">
                <Plus className="h-4 w-4 mr-2" />
                Create something
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="secondary">Browse marketplace</Button>
            </Link>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-cyan-500/15 blur-3xl" />
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Realm Feed</h2>
          <span className="text-sm text-muted">Latest creations</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {MOCK_FEED.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
