import { InfoPageShell, InfoSection } from "@/components/info/InfoPageShell";

export default function RightsPage() {
  return (
    <InfoPageShell
      title="Rights & Terms"
      subtitle="Who owns what, what you may do with content, and the rules of the realm. Last updated: June 2026."
    >
      <InfoSection title="Your content, your rights">
        <p>
          When you publish on Universes of RPG, <strong>you retain ownership</strong> of what you
          create — stories, code, images, character lore, and forum writing. By posting, you grant
          the platform a non-exclusive licence to display, promote, and technically distribute your
          work so other users can view or purchase it according to your pricing settings.
        </p>
        <p>
          You may remove or edit your creations where the product supports it. Paid buyers may
          retain access to content they legitimately purchased, depending on the licence you attach
          to that listing.
        </p>
      </InfoSection>

      <InfoSection title="Guest vs member access">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Guests</strong> may browse teasers, read public comments, and use Explore/Shop
            for discovery. They may not scrape, bulk-download, or redistribute teaser previews.
          </li>
          <li>
            <strong>Members</strong> unlock full content for works they are entitled to view (free
            works after sign-up; premium works after purchase when payments are live).
          </li>
          <li>
            <strong>Invite links</strong> grant temporary full view of a single post without
            membership — do not share invite URLs publicly unless you intend open access.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Creator responsibilities">
        <ul className="list-disc pl-5 space-y-2">
          <li>Only upload work you created or have permission to distribute.</li>
          <li>
            Mark AI-generated or heavily AI-assisted content clearly; misleading attribution may
            lead to removal.
          </li>
          <li>
            Do not publish illegal content, hate speech, harassment, or material that infringes
            third-party copyright or trademarks.
          </li>
          <li>
            Premium listings must accurately describe what the buyer receives (file types, word
            count, licence scope).
          </li>
          <li>Respect other players in forums — no real-world harassment or doxxing.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Buyer & licence terms">
        <p>
          When you purchase premium content (once checkout is live), you receive a{" "}
          <strong>personal use licence</strong> unless the creator states otherwise. Typically this
          means:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>You may use assets and stories in your own RPG games and profiles.</li>
          <li>You may not resell, re-upload, or redistribute the files as-is on other marketplaces.</li>
          <li>You may not claim authorship of work you did not create.</li>
        </ul>
        <p>
          Creators may offer extended licences (commercial use, streaming, etc.) — read each
          listing description before buying.
        </p>
      </InfoSection>

      <InfoSection title="Code templates & profile themes">
        <p>
          HTML/CSS/JS templates are shared for personal RPG profiles and non-commercial fan use
          unless marked as premium with a broader licence. Forking and learning from layout
          previews is encouraged for members; copying locked source without purchase is not.
        </p>
      </InfoSection>

      <InfoSection title="Platform & moderation">
        <p>
          Universes of RPG reserves the right to remove content, suspend accounts, or reject
          listings that violate these terms or applicable law. Admins may act on user reports and
          automated flags. Decisions aim to protect creators and the community — repeated or
          severe violations can result in permanent removal.
        </p>
      </InfoSection>

      <InfoSection title="Privacy">
        <p>
          Account data (email, username) is handled through Supabase authentication. We do not
          sell personal data. Public profiles show only what you choose to publish. For full
          privacy practices, a dedicated policy will be published before public launch.
        </p>
      </InfoSection>

      <InfoSection title="Disclaimer">
        <p>
          Universes of RPG is provided as-is during active development. Features, pricing, and
          these terms may change. Continued use after updates constitutes acceptance of revised
          terms. This document is not legal advice — consult a lawyer for commercial or
          high-stakes publishing decisions.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
