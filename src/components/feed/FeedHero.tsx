"use client";

import Link from "next/link";
import { BookOpen, MessageSquare, PenTool, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function FeedHero() {
  const { isLoggedIn, loading } = useAuth();

  return (
    <section className="comic-hero p-4 sm:p-6 md:p-8">
      <span className="comic-burst text-xs sm:text-sm mb-3 sm:mb-4 inline-block">RPG Social Hub</span>
      <h1 className="font-comic text-2xl sm:text-3xl md:text-5xl leading-tight mt-2 sm:mt-3">
        BUILD WORLDS.
        <br />
        <span className="text-comic-yellow">SHARE STORIES.</span>
      </h1>
      <p className="mt-3 sm:mt-4 text-sm md:text-base opacity-90 max-w-lg leading-relaxed">
        {isLoggedIn
          ? "Welcome back — create, explore, and join the realm."
          : "Browse teasers from creators — like the back of a comic book. Free and premium posts appear here; sign up to unlock full content."}
      </p>
      <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
        {loading ? (
          <div className="h-10 w-36 rounded border-2 border-white/30 bg-white/10 animate-pulse" />
        ) : isLoggedIn ? (
          <>
            <Link href="/create">
              <Button variant="comic">
                <PenTool className="h-4 w-4 mr-2" />
                Create
              </Button>
            </Link>
            <Link href="/forum">
              <Button variant="comic-outline" className="text-white border-white hover:bg-white/10">
                <MessageSquare className="h-4 w-4 mr-2" />
                RPG topics
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="comic-outline" className="text-white border-white hover:bg-white/10">
                <BookOpen className="h-4 w-4 mr-2" />
                Explore
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="comic-outline" className="text-white border-white hover:bg-white/10">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Shop
              </Button>
            </Link>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </section>
  );
}
