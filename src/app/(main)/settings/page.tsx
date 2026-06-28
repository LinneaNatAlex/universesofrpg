"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAccountIdentity } from "@/hooks/useAccountIdentity";
import { useActingIdentity } from "@/hooks/useActingIdentity";
import { LoginCTA } from "@/components/auth/LoginCTA";
import { EditorApplicationForm } from "@/components/editor/EditorApplicationForm";
import { CreatorPayoutSettings } from "@/components/settings/CreatorPayoutSettings";
import { VerifiedCreatorSubscribe } from "@/components/settings/VerifiedCreatorSubscribe";
import { SettingsFriendsManager } from "@/components/settings/SettingsFriendsManager";
import { ProfileAvatarSettings } from "@/components/settings/ProfileAvatarSettings";
import { AccountBirthDateSettings } from "@/components/settings/AccountBirthDateSettings";
import { ProfilePrivacySettings } from "@/components/settings/ProfilePrivacySettings";
import { VerifiedCreatorSettings } from "@/components/settings/VerifiedCreatorSettings";
import { getApplicationsByUsername } from "@/lib/editor-applications-store";
import { cn } from "@/lib/utils";
import { Settings, Shield, UserCheck, Users } from "lucide-react";

type SettingsTab = "applications" | "friends" | "account";

export default function SettingsPage() {
  const { isLoggedIn, loading, user } = useAuth();
  const identity = useActingIdentity();
  const account = useAccountIdentity();
  const [tab, setTab] = useState<SettingsTab>("applications");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    if (requested === "friends" || requested === "account" || requested === "applications") {
      setTab(requested);
    }
  }, []);

  if (loading) {
    return <div className="comic-panel p-8 text-center font-comic">Loading…</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <h1 className="font-comic text-3xl text-ink text-center">Settings</h1>
        <LoginCTA message="Sign in to manage your account, friends, and applications." />
      </div>
    );
  }

  const editorApps = identity ? getApplicationsByUsername(identity.username) : [];
  const editorPending = editorApps.some((a) => a.status === "pending");

  const tabs: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
    { id: "applications", label: "Applications", icon: UserCheck },
    { id: "friends", label: "Friends", icon: Users },
    { id: "account", label: "Account", icon: Settings },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="font-comic text-3xl text-ink">Settings</h1>
        <p className="text-sm text-ink-muted mt-1">
          Applications, friends, and account for @{account?.username ?? identity?.username ?? "you"}
        </p>
      </header>

      <nav className="flex border-2 border-ink bg-comic-yellow/40 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 font-comic text-sm border-r-2 border-ink last:border-r-0 shrink-0",
              tab === id ? "bg-comic-red text-white" : "text-ink hover:bg-comic-yellow"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      {tab === "applications" && (
        <div className="space-y-8">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-comic-red" />
              <h2 className="font-comic text-xl text-ink">Editor application</h2>
              {editorPending && (
                <span className="text-xs font-comic text-comic-red">Pending</span>
              )}
            </div>
            <p className="text-sm text-ink-muted">
              Certified editors review paid Shop content before it goes live. AI-written
              applications are screened and rejected.
            </p>
            <EditorApplicationForm stayOnPage />
          </section>

          <section className="space-y-3 border-t-4 border-dashed border-ink pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-comic-red" />
              <h2 className="font-comic text-xl text-ink">Verified creator badge</h2>
            </div>
            <p className="text-sm text-ink-muted">
              Meet the follower and likes requirements, then subscribe for $9.00/month USD
              through Stripe. Your verified badge unlocks automatically after payment.
            </p>
            <VerifiedCreatorSubscribe />
          </section>

          <section id="shop-payouts" className="space-y-3 border-t-4 border-dashed border-ink pt-6">
            <CreatorPayoutSettings />
          </section>
        </div>
      )}

      {tab === "friends" && (
        <section className="space-y-3">
          <h2 className="font-comic text-xl text-ink">Friends</h2>
          <p className="text-sm text-ink-muted">
            Search creators, send friend requests, and accept incoming requests. Friends appear on
            your profile once you both agree.
          </p>
          <SettingsFriendsManager />
        </section>
      )}

      {tab === "account" && (
        <section className="comic-panel p-5 space-y-4">
          <h2 className="font-comic text-xl text-ink">Account</h2>
          <dl className="text-sm space-y-2">
            <div>
              <dt className="text-ink-muted font-comic text-xs uppercase">Display name</dt>
              <dd>{account?.displayName ?? identity?.displayName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted font-comic text-xs uppercase">Username</dt>
              <dd>@{account?.username ?? identity?.username ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink-muted font-comic text-xs uppercase">Email</dt>
              <dd>{user?.email ?? "—"}</dd>
            </div>
          </dl>
          <AccountBirthDateSettings />
          {account && (
            <Link
              href={`/profile/${account.username}`}
              className="inline-block font-comic text-sm text-comic-red hover:underline"
            >
              View public profile →
            </Link>
          )}
          <ProfileAvatarSettings />
          <ProfilePrivacySettings />
          <VerifiedCreatorSettings />
        </section>
      )}
    </div>
  );
}
