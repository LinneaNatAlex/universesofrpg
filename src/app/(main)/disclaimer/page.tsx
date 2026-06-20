import Link from "next/link";
import { InfoPageShell, InfoSection } from "@/components/info/InfoPageShell";

export default function DisclaimerPage() {
  return (
    <InfoPageShell
      title="Disclaimer & Responsibility"
      subtitle="What Universes of RPG does and does not guarantee — and what you are responsible for as a visitor or member. Last updated: June 2026."
    >
      <InfoSection title="Use at your own risk">
        <p>
          Universes of RPG is a community platform for roleplay creators and players. By browsing,
          signing up, posting, purchasing, or interacting with others here, you do so{" "}
          <strong>at your own risk</strong>. The service is provided on an &ldquo;as is&rdquo; and
          &ldquo;as available&rdquo; basis while it is in active development.
        </p>
        <p>
          We work to keep the realm safe and fun, but we cannot guarantee uninterrupted access,
          error-free features, or that every piece of content or every user interaction will meet
          your expectations.
        </p>
      </InfoSection>

      <InfoSection title="User-generated content">
        <p>
          Almost everything you read, view, or download on this site is created by{" "}
          <strong>other members</strong>, not by Universes of RPG. We do not endorse, verify, or
          guarantee the accuracy, quality, legality, or suitability of user posts, forum writing,
          shop listings, comments, messages, or profile themes.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            Stories, characters, and roleplay are <strong>fictional</strong> unless clearly stated
            otherwise — do not treat them as factual or professional advice.
          </li>
          <li>
            Creators are solely responsible for what they publish, including copyright, licences,
            and content warnings.
          </li>
          <li>
            You are responsible for what you choose to read, buy, share, or reuse — including
            keeping watermarks and attribution intact where required.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Roleplay, mature content & personal safety">
        <p>
          Private RPG topics, forum discussions, and mature (PEGI 18) material are intended for
          consenting adults where age rules apply. Fiction and fantasy do not excuse real-world
          harm, harassment, or illegal behaviour.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            You are responsible for your own boundaries, comfort level, and who you invite into
            private games or chats.
          </li>
          <li>
            Do not share real personal information you are not comfortable exposing. The platform
            is not responsible for what members choose to disclose to each other.
          </li>
          <li>
            If something makes you feel unsafe, use Report, block or unfriend where available, and
            stop engaging. For emergencies, contact local authorities — we are not a crisis
            service.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Interactions with other members">
        <p>
          Messages, friend requests, group chats, and forum replies are between users. Universes
          of RPG is <strong>not liable</strong> for disputes, scams, broken agreements, emotional
          distress, or offline contact that arises from using the platform.
        </p>
        <p>
          Treat other players with respect. You are responsible for your own conduct and for
          deciding who to trust, collaborate with, or purchase from.
        </p>
      </InfoSection>

      <InfoSection title="Purchases & digital goods">
        <p>
          Shop listings, prices, and checkout features may change during development. When payments
          are live, purchases are generally final except where required by law or explicitly
          stated on a listing.
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            We do not guarantee that every premium file will work in every game, tool, or
            browser — read listing descriptions before buying.
          </li>
          <li>
            Minors must not complete paid checkout without guardian approval — see{" "}
            <Link href="/rights" className="text-comic-red font-comic hover:underline">
              Rights &amp; Terms
            </Link>
            .
          </li>
          <li>
            Chargebacks or payment disputes should follow Stripe and platform rules; abuse of
            refunds may lead to account action.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="No professional advice">
        <p>
          Nothing on Universes of RPG constitutes legal, financial, medical, mental-health, or
          other professional advice. For important decisions — especially involving money,
          copyright, or safety — consult qualified professionals in your jurisdiction.
        </p>
      </InfoSection>

      <InfoSection title="Technical limitations">
        <p>
          Code templates, live previews, and uploaded assets may behave differently across devices
          and browsers. Back up work you care about. We are not responsible for lost drafts,
          corrupted uploads, or third-party outages (hosting, auth, payments, etc.).
        </p>
      </InfoSection>

      <InfoSection title="Limitation of liability">
        <p>
          To the fullest extent permitted by applicable law, Universes of RPG and its operators
          shall not be liable for indirect, incidental, special, consequential, or punitive
          damages arising from your use of the platform — including loss of data, profits,
          goodwill, or content.
        </p>
        <p>
          Our total liability for any claim related to the service is limited to the amount you
          paid us in the twelve (12) months before the claim, or zero if you have not paid anything.
        </p>
      </InfoSection>

      <InfoSection title="Your responsibilities">
        <p>By using the site you agree that you will:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Follow applicable laws and our Rights &amp; Terms.</li>
          <li>Provide accurate account information, including birth date for age rules.</li>
          <li>Not hold the platform responsible for choices you make about content or people.</li>
          <li>Accept that features, moderation, and these notices may change without prior notice.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Questions & related pages">
        <p>
          This page is a plain-language summary, not a contract on its own. For ownership,
          licences, and community rules, read{" "}
          <Link href="/rights" className="text-comic-red font-comic hover:underline">
            Rights &amp; Terms
          </Link>
          . For how things work, see{" "}
          <Link href="/faq" className="text-comic-red font-comic hover:underline">
            FAQ
          </Link>
          .
        </p>
        <p>
          Continued use after updates means you accept revised notices. This is not legal advice —
          seek a lawyer for commercial publishing or high-stakes decisions.
        </p>
      </InfoSection>
    </InfoPageShell>
  );
}
