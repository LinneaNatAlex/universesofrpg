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
          <li>
            Include a visible creator watermark on work you sell or share so buyers and viewers
            always know who made it — see <strong>Creator attribution &amp; watermarks</strong>.
          </li>
          <li>Respect other players in forums — no real-world harassment or doxxing.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Creator attribution & watermarks">
        <p>
          Work on Universes of RPG is made by real creators. To protect authorship and give proper
          credit, the platform requires clear <strong>creator attribution</strong> on content that
          originates from someone else — whether it is free, purchased, or embedded in a profile.
        </p>
        <p>
          <strong>Text and writing</strong> (stories, forum posts, comments) already show the
          author on the platform — that counts as attribution. <strong>Images, templates, audio,
          and downloadable assets</strong> should include a visible watermark or credit line where
          practical, since those formats do not always show who made them automatically.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Creators</strong> must ensure listings they publish (especially images,
            templates, and assets) include a clear watermark or attribution line identifying the
            creator — typically display name and/or @username and a link back to the original work
            on Universes of RPG where technically possible.
          </li>
          <li>
            <strong>Buyers and users</strong> who purchase or use another creator&apos;s work must
            keep that watermark intact. Purchasing a licence does not remove the obligation to
            show who made the work.
          </li>
          <li>
            <strong>After purchase</strong>, you may use the content in your RPG profiles, games,
            and personal projects as allowed by the licence — but the watermark (or equivalent
            on-screen credit) must remain visible and must still point to the creator and the
            original listing unless the creator has granted a separate written exception.
          </li>
          <li>
            Removing, obscuring, cropping out, or replacing another creator&apos;s watermark
            without permission is a violation of these terms and may result in loss of access,
            refunds at the platform&apos;s discretion, or account action.
          </li>
          <li>
            When you fork, remix, or build on someone else&apos;s template or asset, your new work
            should credit the original creator in addition to any watermark on the source material.
          </li>
        </ul>
        <p>
          Platform previews, Shop teasers, and downloaded deliverables may embed watermarks
          automatically as this feature rolls out. Until then, creators and buyers are still bound
          by the attribution rules above.
        </p>
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
          <li>
            You must keep creator watermarks and attribution on purchased or used work, as
            described in <strong>Creator attribution &amp; watermarks</strong> above.
          </li>
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
        <p>
          Templates applied to your profile must retain the original creator&apos;s watermark or
          credit when the theme was made by someone else — including after you buy premium source
          code.
        </p>
      </InfoSection>

      <InfoSection title="Content moderation & editors">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Free content</strong> is auto-approved when published and appears in Explore
            once live.
          </li>
          <li>
            <strong>Paid Shop content</strong> (code, stories, assets) requires approval from a
            certified editor before listing.
          </li>
          <li>
            Editor decisions are logged in an audit trail. Admins may override any editor decision.
          </li>
          <li>
            Users may dispute editor reviews once the dispute system ships; until then, contact
            the site maintainer.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Editor programme & independent contractors">
        <p>
          Editors on Universes of RPG are <strong>independent contractors</strong>, not employees
          of the platform. By applying and accepting an editor licence you agree that:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            You are responsible for taxes, reporting, and compliance in your own jurisdiction.
          </li>
          <li>
            Editor applications must be your own original work. AI-generated applications are not
            accepted and are screened with automated tools.
          </li>
          <li>
            Review fees (when Stripe freelancer payouts launch) are set within platform rate
            ranges; the platform may take a commission (e.g. 10–20%).
          </li>
          <li>
            Editors may lose their licence for bias, low-quality reviews, abuse, or repeated
            community reports. Trust scores and admin audits apply.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Age & purchases">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            You must be at least <strong>13 years old</strong> to create an account and use
            Universes of RPG.
          </li>
          <li>
            At signup we ask for your <strong>birth date</strong> only — it is used for age rules
            and is <strong>not shown</strong> on your public profile.
          </li>
          <li>
            If you are <strong>under 18</strong>, a parent or legal guardian must review these
            terms with you when you sign up, and must approve each paid Shop purchase before
            checkout.
          </li>
          <li>
            By registering, you confirm that your birth date is accurate and that you accept these
            Rights &amp; Terms.
          </li>
          <li>
            Paid purchases use Stripe. Minors should not complete checkout without guardian
            approval. The platform may block checkout when age rules are not met.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Google sign-in & privacy">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            You may sign in with Google to verify your account. We do <strong>not</strong> display
            your Gmail address or Google real name on your public profile.
          </li>
          <li>
            You choose your own <strong>public username</strong> — that is what other members see
            on posts, comments, and your profile page.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Sexual content (PEGI 18)">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Creators must mark creations, RPG topics, and forum discussions that contain{" "}
            <strong>sexual content</strong> (nudity, erotic themes, or explicit scenes) when
            publishing.
          </li>
          <li>
            Marked content is labelled <strong>PEGI 18</strong> and is only shown in full to
            signed-in members aged <strong>18 or older</strong>, consistent with common age-rating
            and marketplace rules.
          </li>
          <li>
            Sexual content is hidden from public feeds and lists for guests and under-18 accounts.
            Direct links show a restricted notice instead of the full work.
          </li>
          <li>
            Illegal, non-consensual, or exploitative sexual content is prohibited and may be removed
            without notice.
          </li>
        </ul>
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
