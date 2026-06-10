import Link from "next/link";

interface InfoPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function InfoPageShell({ title, subtitle, children }: InfoPageShellProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-4">
      <header className="space-y-2">
        <h1 className="font-comic text-3xl md:text-4xl text-ink">{title}</h1>
        {subtitle && (
          <p className="text-sm md:text-base text-ink-muted leading-relaxed">{subtitle}</p>
        )}
      </header>
      {children}
      <nav className="comic-panel px-4 py-3 flex flex-wrap gap-3 text-xs font-comic text-ink-muted">
        <Link href="/about" className="hover:text-comic-red">
          About
        </Link>
        <span>·</span>
        <Link href="/faq" className="hover:text-comic-red">
          FAQ
        </Link>
        <span>·</span>
        <Link href="/rights" className="hover:text-comic-red">
          Rights
        </Link>
        <span className="hidden sm:inline">·</span>
        <Link href="/" className="hover:text-comic-red hidden sm:inline">
          ← Back to feed
        </Link>
      </nav>
    </div>
  );
}

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="comic-panel p-5 md:p-6 space-y-3">
      <h2 className="font-comic text-xl text-ink border-b-2 border-dashed border-ink pb-2">
        {title}
      </h2>
      <div className="text-sm text-ink-muted leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
