"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  Suspense,
} from "react";
import {
  House,
  ImageSquare,
  FilmSlate,
  GlobeHemisphereWest,
  GearSix,
  CircleNotch,
} from "@phosphor-icons/react";

// ─── Shared profile context ────────────────────────────────────────────────

interface BrandImage {
  brand_name: string;
  brand_voice: string;
  target_audience: string;
  content_style: string;
  content_themes: string[];
  cultural_notes: Record<string, string>;
  ugc_suggestions: string[];
  target_markets: string[];
}

interface ProfileData {
  user_id: string;
  onboarding_complete: boolean;
  brandImage?: {
    brand_url: string;
    brand_name: string;
    brand_voice: string;
    target_audience: string;
    content_style: string;
    full_brand_image: BrandImage;
  } | null;
}

interface DashboardContextValue {
  profile: ProfileData | null;
  loading: boolean;
  refetchProfile: () => void;
  updateBrandImage: (b: BrandImage) => void;
}

const DashboardContext = createContext<DashboardContextValue>({
  profile: null,
  loading: true,
  refetchProfile: () => {},
  updateBrandImage: () => {},
});

export function useDashboard() {
  return useContext(DashboardContext);
}

// ─── Nav items ──────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: "/dashboard", tab: null, label: "Home", icon: House },
  { href: "/dashboard?tab=brand", tab: "brand", label: "Brand", icon: ImageSquare },
  { href: "/dashboard?tab=studio", tab: "studio", label: "Studio", icon: FilmSlate },
  { href: "/dashboard?tab=localize", tab: "localize", label: "Localize", icon: GlobeHemisphereWest },
];

// ─── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const isSettings = pathname === "/dashboard/settings";
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`group/sidebar relative flex h-full shrink-0 flex-col bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] dark:bg-zinc-950 ${
        expanded ? "w-52" : "w-[52px]"
      }`}
      style={{ borderRight: "0.5px solid var(--color-border-tertiary, #e5e5e5)" }}
    >
      {/* Logo */}
      <div className="flex h-12 shrink-0 items-center overflow-hidden px-3.5">
        <div
          className="shrink-0 text-lg leading-none"
          style={{ fontFamily: "var(--font-instrument-serif, serif)", letterSpacing: "-0.3px" }}
        >
          <span className="text-zinc-900 dark:text-zinc-50">R</span>
          <span
            className={`inline-block overflow-hidden transition-all duration-300 ${
              expanded ? "max-w-[120px] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            eel
          </span>
          <span className="italic text-zinc-400 dark:text-zinc-500">
            {expanded ? "Atlas" : "a"}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-2.5" style={{ height: "0.5px", background: "var(--color-border-tertiary, #e5e5e5)" }} />

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-1.5 py-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = !isSettings && (
            item.tab === null
              ? pathname === "/dashboard" && !currentTab
              : currentTab === item.tab
          );
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              title={!expanded ? item.label : undefined}
              className={`group/item relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-50"
                  : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800/40 dark:hover:text-zinc-300"
              }`}
            >
              <Icon size={18} weight={isActive ? "fill" : "regular"} className="shrink-0" />
              <span
                className={`whitespace-nowrap transition-all duration-300 ${
                  expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 pointer-events-none absolute left-10"
                }`}
              >
                {item.label}
              </span>
              {/* Active indicator dot — only when collapsed */}
              {isActive && !expanded && (
                <span className="absolute -right-0.5 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom — settings + user */}
      <div className="shrink-0 px-1.5 pb-2 space-y-0.5">
        {/* Divider */}
        <div className="mx-1" style={{ height: "0.5px", background: "var(--color-border-tertiary, #e5e5e5)", marginBottom: "4px" }} />

        <button
          onClick={() => router.push("/dashboard/settings")}
          title={!expanded ? "Settings" : undefined}
          className={`relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
            isSettings
              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-50"
              : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800/40 dark:hover:text-zinc-300"
          }`}
        >
          <GearSix size={18} weight={isSettings ? "fill" : "regular"} className="shrink-0" />
          <span
            className={`whitespace-nowrap transition-all duration-300 ${
              expanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 pointer-events-none absolute left-10"
            }`}
          >
            Settings
          </span>
        </button>

        {/* User */}
        <div
          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-150 ${
            expanded ? "" : "justify-center"
          }`}
        >
          <div className="shrink-0">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-6 h-6",
                },
              }}
            />
          </div>
          <div
            className={`min-w-0 flex-1 transition-all duration-300 ${
              expanded ? "opacity-100" : "opacity-0 pointer-events-none absolute left-12 w-0 overflow-hidden"
            }`}
          >
            <p className="truncate text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-600">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    const data = await res.json();
    setProfile(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function updateBrandImage(updated: BrandImage) {
    if (!profile?.brandImage) return;
    setProfile({
      ...profile,
      brandImage: {
        ...profile.brandImage,
        full_brand_image: updated,
      },
    });
  }

  const ctxValue: DashboardContextValue = {
    profile,
    loading,
    refetchProfile: () => {
      setLoading(true);
      fetchProfile();
    },
    updateBrandImage,
  };

  // Loading state
  if (loading) {
    return (
      <DashboardContext.Provider value={ctxValue}>
        <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950">
          <CircleNotch size={20} className="animate-spin text-zinc-300 dark:text-zinc-600" />
        </div>
      </DashboardContext.Provider>
    );
  }

  // Onboarding not complete — render children full-screen (no sidebar)
  if (!profile?.onboarding_complete) {
    return (
      <DashboardContext.Provider value={ctxValue}>
        {children}
      </DashboardContext.Provider>
    );
  }

  // Post-onboarding — sidebar + content
  return (
    <DashboardContext.Provider value={ctxValue}>
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
        <Suspense>
          <Sidebar />
        </Suspense>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </DashboardContext.Provider>
  );
}
