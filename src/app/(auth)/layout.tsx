import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="px-4 py-4 border-b-4 border-ink bg-comic-yellow">
        <Link href="/" className="font-comic text-sm text-ink hover:text-comic-red transition-colors">
          ← Back to feed
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-8">{children}</div>
    </div>
  );
}
