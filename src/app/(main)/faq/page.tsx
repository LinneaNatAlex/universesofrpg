import Link from "next/link";
import { InfoPageShell } from "@/components/info/InfoPageShell";

const FAQ_ITEMS = [
  {
    q: "Do I need an account to browse?",
    a: "No. Guests can browse the feed, Explore, and Shop teasers without signing up. You will see plot synopses, blurred asset previews, and layout previews — but not full chapters, high-resolution images, or source code.",
  },
  {
    q: "What is the difference between Explore and the Shop?",
    a: "Explore lists only free creations — stories, templates, and assets you can own without paying. The Shop lists premium (paid) content such as character packs, profile themes, and complete story arcs. Free works never appear in the Shop.",
  },
  {
    q: "Does “free” mean I can read everything without logging in?",
    a: "Not quite. “Free” means no purchase is required once you have an account. Guests still see teasers only. Sign up (it is free) to unlock full text, images, code, and forum access for free works.",
  },
  {
    q: "How do I create and publish content?",
    a: "Sign in, then go to Create. You can publish writings, RPG story chapters, or code templates. Forum posts and private RPG sessions are available under Forum once you are logged in.",
  },
  {
    q: "Can I sell my creations?",
    a: "Yes — that is what the Shop is for. Creators set prices on premium listings. Stripe checkout is being integrated; until then, purchase buttons show a placeholder flow.",
  },
  {
    q: "What content types are supported?",
    a: "Character sheets, coded profile themes (HTML/CSS/JS), story segments, digital assets (portrait packs, art), collaborative threads, and long-form writing. Each type has a tailored teaser view for guests.",
  },
  {
    q: "Can I comment without an account?",
    a: "You can read all comments as a guest. Only logged-in members can write comments.",
  },
  {
    q: "Why are likes hidden when I am logged out?",
    a: "Likes are a community interaction for members. Guests can still see comment counts and view teasers.",
  },
  {
    q: "What are invite links?",
    a: "Some posts support an invite token in the URL (?invite=…). If the token matches, guests can view that specific post in full without creating an account — useful for sharing with a trusted group.",
  },
  {
    q: "How does the private forum work?",
    a: "Forums are member-only spaces for ongoing RPG games. You invite friends, organise chapters, and attach metadata (era, season, location, when). Think of it as a structured play-by-post room.",
  },
  {
    q: "Is AI-generated content allowed?",
    a: "Creators should label AI-assisted work honestly. Moderators can review flagged content. We encourage human creativity and clear attribution — see our Rights page for ownership rules.",
  },
  {
    q: "How do I report a problem or inappropriate content?",
    a: "Reporting tools are being expanded. Admins can review posts, comments, and reports from the Admin panel. If you are a user with a concern, contact the site maintainer directly until in-app reporting ships.",
  },
  {
    q: "I signed up but did not receive a confirmation email.",
    a: "Check your spam folder. Supabase sends the confirmation link. Make sure your site URL and redirect URLs are configured in the Supabase dashboard (including /auth/callback). You can also ask an admin to disable email confirmation for testing.",
  },
];

export default function FaqPage() {
  return (
    <InfoPageShell
      title="FAQ"
      subtitle="Common questions about browsing, creating, buying, and playing on Universes of RPG."
    >
      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => (
          <details key={item.q} className="comic-panel group">
            <summary className="px-5 py-4 font-comic text-ink cursor-pointer list-none flex items-center justify-between gap-3 hover:text-comic-red transition-colors">
              <span>{item.q}</span>
              <span className="text-comic-red text-lg shrink-0 group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <div className="px-5 pb-4 text-sm text-ink-muted leading-relaxed border-t-2 border-dashed border-ink pt-3">
              {item.a}
            </div>
          </details>
        ))}
      </div>

      <p className="text-sm text-ink-muted text-center pt-2">
        Still stuck? Read{" "}
        <Link href="/rights" className="font-comic text-comic-red hover:underline">
          Rights &amp; terms
        </Link>{" "}
        or visit{" "}
        <Link href="/about" className="font-comic text-comic-red hover:underline">
          About
        </Link>
        .
      </p>
    </InfoPageShell>
  );
}
