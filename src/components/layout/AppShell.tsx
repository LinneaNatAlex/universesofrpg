"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Home,
  MessageSquare,
  MessagesSquare,
  PenTool,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonaProvider } from "@/contexts/PersonaContext";
import { AdminPersonaBar } from "@/components/admin/AdminPersonaBar";
import { useAdmin } from "@/hooks/useAdmin";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { ContentHydrator } from "@/components/content/ContentHydrator";
import { ContentSyncNotice } from "@/components/content/ContentSyncNotice";
import { PurchasesHydrator } from "@/components/stripe/PurchasesHydrator";
import { FriendsHydrator } from "@/components/social/FriendsHydrator";
import { VerificationCheckoutReturn } from "@/components/stripe/VerificationCheckoutReturn";

type NavItem = {
  href: string;
  label: string;
  /** Shorter label for the bottom bar on phones */
  mobileLabel?: string;
  icon: LucideIcon;
  auth?: boolean;
  /** Hide from bottom bar when signed in (still in header + account menu) */
  hideOnMobileWhenLoggedIn?: boolean;
};

const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Feed", mobileLabel: "Feed", icon: Home },
  { href: "/explore", label: "Explore", mobileLabel: "Explore", icon: Compass },
  { href: "/marketplace", label: "Shop", mobileLabel: "Shop", icon: ShoppingBag },
  { href: "/create", label: "Create", mobileLabel: "Create", icon: PenTool, auth: true },
  {
    href: "/discussions",
    label: "Forum discussions",
    mobileLabel: "Forum",
    icon: MessagesSquare,
    hideOnMobileWhenLoggedIn: true,
  },
  {
    href: "/forum",
    label: "RPG (Topics)",
    mobileLabel: "RPG",
    icon: MessageSquare,
    auth: true,
  },
];

function filterNav(items: NavItem[], isLoggedIn: boolean, forMobile = false) {
  return items.filter((item) => {
    if (item.auth && !isLoggedIn) return false;
    if (forMobile && item.hideOnMobileWhenLoggedIn && isLoggedIn) return false;
    return true;
  });
}

function NavLink({
  href,
  label,
  mobileLabel,
  icon: Icon,
  active,
  compact = false,
}: NavItem & { active: boolean; compact?: boolean }) {
  const displayLabel = compact ? (mobileLabel ?? label) : label;

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex items-center font-comic border-2 border-ink transition-all",
        compact
          ? "flex-1 flex-col justify-center gap-0.5 min-w-0 px-1 py-1.5 text-[10px] leading-none"
          : "gap-1.5 px-3 py-1.5 text-sm",
        active
          ? "bg-comic-red text-white shadow-[2px_2px_0_#1a1a2e]"
          : "bg-surface text-ink hover:bg-comic-yellow shadow-[2px_2px_0_#1a1a2e] hover:shadow-[1px_1px_0_#1a1a2e] hover:translate-x-0.5 hover:translate-y-0.5"
      )}
    >
      <Icon className={cn("shrink-0", compact ? "h-5 w-5" : "h-4 w-4")} />
      <span className={compact ? "truncate w-full text-center max-w-full" : "whitespace-nowrap"}>
        {displayLabel}
      </span>
    </Link>
  );
}

function AppShellHeader() {
  const pathname = usePathname();
  const { isLoggedIn } = useAdmin();
  const mainNav = filterNav(MAIN_NAV, isLoggedIn);
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 border-b-4 border-ink bg-comic-yellow">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-comic-red text-white font-comic text-base sm:text-lg px-2 py-0.5 border-2 border-ink shadow-[2px_2px_0_#1a1a2e]">
              UoRPG
            </div>
            <span className="font-comic text-base sm:text-lg text-ink hidden sm:inline">
              Universes
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 flex-1 justify-center max-w-xl">
            {mainNav.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                active={
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)
                }
              />
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {isLoggedIn && <NotificationBell />}
            <UserMenu />
          </div>
        </div>
      </div>
      {!isAdminRoute && <AdminPersonaBar />}
    </header>
  );
}

function AppShellNav() {
  const pathname = usePathname();
  const { isLoggedIn } = useAdmin();
  const mobileNav = filterNav(MAIN_NAV, isLoggedIn, true);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 border-t-4 border-ink bg-comic-yellow z-40 safe-area-pb">
      <div className="flex items-stretch gap-0.5 px-1 pt-1.5">
        {mobileNav.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            compact
            active={
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
            }
          />
        ))}
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <PersonaProvider>
      <div className="min-h-screen flex flex-col">
        <AppShellHeader />
        <ContentHydrator />
        <ContentSyncNotice />
        <FriendsHydrator />
        <PurchasesHydrator />
        <VerificationCheckoutReturn />
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <SiteFooter />
        <AppShellNav />
      </div>
    </PersonaProvider>
  );
}
