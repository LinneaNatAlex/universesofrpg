"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  HelpCircle,
  Home,
  Info,
  LogOut,
  MessageSquare,
  PenTool,
  ScrollText,
  ShoppingBag,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonaProvider } from "@/contexts/PersonaContext";
import { PersonaBanner } from "@/components/admin/PersonaBanner";
import { PersonaSwitcher } from "@/components/admin/PersonaSwitcher";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { useAdmin } from "@/hooks/useAdmin";
import { createClient } from "@/lib/supabase/client";
import { SiteFooter } from "@/components/layout/SiteFooter";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
  auth?: boolean;
};

const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass, hint: "Free" },
  { href: "/marketplace", label: "Shop", icon: ShoppingBag, hint: "Paid" },
  { href: "/create", label: "Create", icon: PenTool, auth: true },
  { href: "/forum", label: "Forum", icon: MessageSquare, auth: true },
];

const INFO_NAV: NavItem[] = [
  { href: "/about", label: "About", icon: Info },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/rights", label: "Rights", icon: ScrollText },
];

function filterNav(items: NavItem[], isLoggedIn: boolean) {
  return items.filter((item) => !item.auth || isLoggedIn);
}

function DesktopNavLink({
  href,
  label,
  icon: Icon,
  hint,
  active,
}: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      title={hint ? `${label} — ${hint}` : label}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-comic border-2 transition-colors whitespace-nowrap",
        active
          ? "bg-comic-red text-white border-ink shadow-[2px_2px_0_#1a1a2e]"
          : "border-transparent text-ink hover:border-ink hover:bg-surface"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>
        {label}
        {hint && <span className="block text-[10px] opacity-70 leading-none">{hint}</span>}
      </span>
    </Link>
  );
}

function AppShellHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, loading, isAdmin } = useAdmin();
  const identity = useActingIdentity();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const profileHref = identity
    ? `/profile/${identity.username}`
    : user
      ? `/profile/${user.user_metadata?.username ?? "me"}`
      : "/login";

  const mainNav = filterNav(MAIN_NAV, isLoggedIn);
  const infoNav = filterNav(INFO_NAV, isLoggedIn);

  return (
    <>
      <header className="sticky top-0 z-50 border-b-4 border-ink bg-comic-yellow">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between px-4 gap-2 py-2">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-comic-red text-white font-comic text-lg px-2 py-0.5 border-2 border-ink shadow-[2px_2px_0_#1a1a2e]">
              UoRPG
            </div>
            <span className="font-comic text-lg text-ink hidden sm:inline">Universes</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 flex-wrap justify-center">
            {mainNav.map((item) => (
              <DesktopNavLink key={item.href} {...item} active={pathname === item.href} />
            ))}
            <span className="w-px h-6 bg-ink/25 mx-1 shrink-0" aria-hidden />
            {infoNav.map((item) => (
              <DesktopNavLink key={item.href} {...item} active={pathname === item.href} />
            ))}
          </nav>

          <nav className="hidden md:flex lg:hidden items-center gap-0.5 overflow-x-auto max-w-[45vw]">
            {[...mainNav, ...infoNav].map((item) => (
              <DesktopNavLink key={item.href} {...item} active={pathname === item.href} />
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {!loading && isLoggedIn && isAdmin && <PersonaSwitcher />}
            {!loading && !isLoggedIn && (
              <>
                <Link href="/login" className="text-sm font-comic text-ink hover:text-comic-red">
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-comic-red text-white font-comic text-sm px-3 py-1.5 border-2 border-ink shadow-[2px_2px_0_#1a1a2e]"
                >
                  Join
                </Link>
              </>
            )}
            {!loading && isLoggedIn && (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden sm:flex items-center gap-1 text-sm font-comic text-ink hover:text-comic-red"
                    title="Admin panel"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hidden sm:flex items-center gap-1 text-sm font-comic text-ink-muted hover:text-comic-red"
                >
                  <LogOut className="h-4 w-4" />
                  Out
                </button>
              </>
            )}
            <Link
              href={profileHref}
              className="flex h-8 w-8 items-center justify-center border-2 border-ink bg-surface text-ink hover:bg-comic-yellow"
              title={identity ? `Profile: @${identity.username}` : "Profile"}
            >
              <User className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>
      <PersonaBanner />
    </>
  );
}

function AppShellNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAdmin();
  const mobileNav = [...filterNav(MAIN_NAV, isLoggedIn), ...filterNav(INFO_NAV, isLoggedIn)];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 border-t-4 border-ink bg-comic-yellow z-40">
      <div className="flex overflow-x-auto gap-1 px-2 py-2 scrollbar-none">
        {mobileNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2.5 py-1 text-[10px] font-comic shrink-0 min-w-[3.25rem]",
                active ? "text-comic-red" : "text-ink"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PersonaProvider>
      <div className="min-h-screen flex flex-col">
        <AppShellHeader />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 pb-20 md:pb-8">
          {children}
        </main>
        <SiteFooter />
        <AppShellNav />
      </div>
    </PersonaProvider>
  );
}
