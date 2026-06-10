import Link from "next/link";
import { InfoPageShell, InfoSection } from "@/components/info/InfoPageShell";

export default function AboutPage() {
  return (
    <InfoPageShell
      title="About Universes of RPG"
      subtitle="A social hub where roleplay creators build identities, share stories, and sell digital RPG works."
    >
      <InfoSection title="What is this?">
        <p>
          <strong>Universes of RPG</strong> is a platform for tabletop and online roleplay
          communities. Creators publish character sheets, coded profile themes, story chapters,
          portrait packs, and collaborative forum threads — then choose to share them for free or
          sell them in the Shop.
        </p>
        <p>
          Think of it as a mix of a creative feed, a free discovery gallery (Explore), and a
          creator marketplace — all wrapped in a retro comics aesthetic.
        </p>
      </InfoSection>

      <InfoSection title="Who is it for?">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Players & writers</strong> who want to read RPG stories, browse character
            ideas, and join private forum games.
          </li>
          <li>
            <strong>Creators</strong> who build profile layouts, lore packs, art bundles, and
            premium story arcs.
          </li>
          <li>
            <strong>Guests</strong> who can browse teasers without an account — like reading the
            back cover of a comic before buying the issue.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="How the site is organised">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <Link href="/" className="text-comic-red hover:underline font-comic">
              Feed
            </Link>{" "}
            — latest teasers from all creators (free and premium).
          </li>
          <li>
            <Link href="/explore" className="text-comic-red hover:underline font-comic">
              Explore
            </Link>{" "}
            — every free work on the platform; search and browse by tag.
          </li>
          <li>
            <Link href="/marketplace" className="text-comic-red hover:underline font-comic">
              Shop
            </Link>{" "}
            — premium listings only; buy character packs, themes, and story arcs.
          </li>
          <li>
            <Link href="/create" className="text-comic-red hover:underline font-comic">
              Create
            </Link>{" "}
            — publish writings, stories, and code templates (members only).
          </li>
          <li>
            <Link href="/forum" className="text-comic-red hover:underline font-comic">
              Forum
            </Link>{" "}
            — private RPG sessions with friends, chapters, and in-world metadata.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Our mission">
        <p>
          We want RPG creation to feel social and discoverable — not buried in scattered Discord
          threads or locked Google Docs. Every profile is a persona, every post can be a world
          fragment, and every reader can stumble into something new without needing a credit card
          first.
        </p>
        <p>
          The platform is actively evolving. Payments (Stripe), full database persistence, and
          expanded moderation tools are on the roadmap.
        </p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>
          Questions, feedback, or partnership ideas? Reach out through the project maintainer or
          open an issue on the project repository. We read every message.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
