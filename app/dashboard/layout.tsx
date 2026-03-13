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
  GearSix,
  SidebarSimple,
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
  { href: "/dashboard?tab=brand", tab: "brand", label: "Brand Image", icon: ImageSquare },
];

// ─── Sidebar (needs useSearchParams inside Suspense) ────────────────────────

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const isSettings = pathname === "/dashboard/settings";

  return (
    <aside
      className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo + collapse */}
      <div
        className={`flex shrink-0 items-center border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 ${collapsed ? "justify-center" : "justify-between"}`}
      >
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            ReelAtlas
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-lg p-1.5 text-zinc-400 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <SidebarSimple
            size={18}
            className={`transition-transform duration-300 ${collapsed ? "scale-x-[-1]" : ""}`}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-3">
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
              title={collapsed ? item.label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom: user + settings */}
      <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div
          className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-3"}`}
        >
          <UserButton />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-zinc-400">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          )}
          <button
            onClick={() => router.push("/dashboard/settings")}
            title="Settings"
            className={`rounded-lg p-1.5 transition-all duration-200 ${
              isSettings
                ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <GearSix size={16} />
          </button>
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
  const [collapsed, setCollapsed] = useState(false);

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
        <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <CircleNotch size={24} className="animate-spin text-zinc-400" />
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
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </Suspense>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </DashboardContext.Provider>
  );
}
