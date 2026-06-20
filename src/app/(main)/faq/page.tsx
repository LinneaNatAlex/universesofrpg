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
    a: "Yes — that is what the Shop is for. Creators set prices on premium listings. Paid posts are held as pending until a certified editor approves them. Free posts publish immediately. Stripe checkout is being integrated; until then, purchase buttons show a placeholder flow.",
  },
  {
    q: "What are Editors?",
    a: "Editors are certified community reviewers who approve paid Shop listings before they go live. They apply with a writing sample, code excerpt, or certificate — AI-written applications are screened and rejected. Admins grant editor levels (Junior, Standard, Senior). Editors are independent contractors; see Rights for payment terms.",
  },
  {
    q: "How do I become an Editor?",
    a: "Sign in and visit Apply to become an Editor. Submit your motivation and an original sample (not AI-generated). An admin reviews your application and grants a licence level. Approved editors get a badge on their profile, access to the Editor Portal review queue, and can message creators directly about pending Shop listings.",
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
    a: "RPG Topics are play-by-post stories with friends. Add a short teaser synopsis when you create one, organise parts (not every post is a new part), and optionally mark the topic private. When the story is finished, the creator can lock it and publish to the Shop so readers buy the full arc.",
  },
  {
    q: "Is AI-generated content allowed?",
    a: "Creators should label AI-assisted work honestly. Moderators can review flagged content. We encourage human creativity and clear attribution — see our Rights page for ownership rules.",
  },
  {
    q: "Can I send private messages?",
    a: "Yes. Friends can DM each other from the Message button on a profile, or start a group chat under Messages → New group. Editors can open a review thread with a creator from the Editor Portal while a paid listing is pending.",
  },
  {
    q: "How do I report a problem or inappropriate content?",
    a: "Use Report on posts, comments, chat members, or profiles. Reports are saved locally in demo mode and appear in Admin → Reports. Admins can resolve, dismiss, add notes, or delete reported posts.",
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
        </Link>
        ,{" "}
        <Link href="/disclaimer" className="font-comic text-comic-red hover:underline">
          Disclaimer
        </Link>
        , or visit{" "}
        <Link href="/about" className="font-comic text-comic-red hover:underline">
          About
        </Link>
        .
      </p>
    </InfoPageShell>
  );
}
