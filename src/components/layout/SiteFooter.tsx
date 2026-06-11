import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/rights", label: "Rights" },
  { href: "/settings", label: "Settings" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-ink bg-comic-yellow mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="font-comic text-sm text-ink">
          © {new Date().getFullYear()} Universes of RPG
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-comic">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="text-ink hover:text-comic-red transition-colors">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
