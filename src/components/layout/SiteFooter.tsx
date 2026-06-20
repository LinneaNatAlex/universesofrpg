import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/rights", label: "Rights" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/settings", label: "Settings" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t-4 border-ink bg-comic-yellow mt-auto">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-3 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <p className="font-comic text-xs sm:text-sm text-ink text-center sm:text-left hidden sm:block">
          © {new Date().getFullYear()} Universes of RPG
        </p>
        <nav className="flex flex-wrap justify-center sm:justify-end gap-x-3 gap-y-1 text-[11px] sm:text-sm font-comic pb-1 md:pb-0">
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
