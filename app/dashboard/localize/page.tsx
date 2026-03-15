"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  GlobeHemisphereWest,
  ArrowLeft,
  CircleNotch,
  CheckCircle,
  ArrowCounterClockwise,
  Plus,
} from "@phosphor-icons/react";
import ScriptEditor from "../components/ScriptEditor";
import { useDashboard } from "../layout";

interface Script {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  ready_to_localize?: boolean;
}

interface Localization {
  market_code: string;
  locale: string;
  content: string;
}

const COUNTRIES = [
  { code: "IN", label: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "US", label: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "BR", label: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "ID", label: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "MX", label: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "VN", label: "Vietnam", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "RU", label: "Russia", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "TR", label: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "JP", label: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "UK", label: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "DE", label: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "KR", label: "South Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "FR", label: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "CA", label: "Canada", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "AU", label: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
];

export default function LocalizePage() {
  const { profile } = useDashboard();
  const brandImage = profile?.brandImage?.full_brand_image;
  const targetMarkets = brandImage?.target_markets || [];

  const [scripts, setScripts] = useState<Script[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Detail view state
  const [activeScript, setActiveScript] = useState<Script | null>(null);
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [localizing, setLocalizing] = useState(false);
  const [localizingMarkets, setLocalizingMarkets] = useState<Set<string>>(new Set());
  const [localizations, setLocalizations] = useState<Record<string, Localization>>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [showMarketSelection, setShowMarketSelection] = useState(true);

  useEffect(() => {
    fetch("/api/scripts")
      .then((res) => res.json())
      .then((data) => {
        setScripts(
          (data.scripts || []).filter((s: Script) => s.ready_to_localize),
        );
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Fetch existing localizations when a script is opened
  useEffect(() => {
    if (!activeScript) return;
    setLoadingExisting(true);
    fetch(`/api/localize?scriptId=${activeScript.id}`)
      .then((res) => res.json())
      .then((data) => {
        const existing = data.localizations || [];
        if (existing.length > 0) {
          const map: Record<string, Localization> = {};
          for (const loc of existing) {
            map[loc.market_code] = loc;
          }
          setLocalizations(map);
          setActiveTab(existing[0].market_code);
          setShowMarketSelection(false);
        } else {
          setShowMarketSelection(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  }, [activeScript]);

  function openScript(script: Script) {
    setActiveScript(script);
    setSelectedMarkets(new Set());
    setLocalizations({});
    setActiveTab("");
    setShowMarketSelection(true);
  }

  function closeScript() {
    setActiveScript(null);
    setSelectedMarkets(new Set());
    setLocalizations({});
    setActiveTab("");
    setLocalizingMarkets(new Set());
  }

  function toggleMarket(code: string) {
    setSelectedMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleAll() {
    if (selectedMarkets.size === availableMarkets.length) {
      setSelectedMarkets(new Set());
    } else {
      setSelectedMarkets(new Set(availableMarkets.map((m) => m.code)));
    }
  }

  const availableMarkets = COUNTRIES.filter((c) =>
    targetMarkets.includes(c.code),
  );

  async function handleLocalize(markets?: string[]) {
    if (!activeScript) return;

    const marketsToLocalize = markets || Array.from(selectedMarkets);
    if (marketsToLocalize.length === 0) return;

    setLocalizing(true);
    setLocalizingMarkets(new Set(marketsToLocalize));

    try {
      const res = await fetch("/api/localize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: activeScript.id,
          targetMarkets: marketsToLocalize,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to localize");
      }

      const data = await res.json();
      const newLocalizations = { ...localizations };

      for (const [market, result] of Object.entries(
        data.results as Record<
          string,
          { locale: string; content: string; success: boolean; error?: string }
        >,
      )) {
        if (result.success) {
          newLocalizations[market] = {
            market_code: market,
            locale: result.locale,
            content: result.content,
          };
        } else {
          toast.error(`Failed to localize for ${market}: ${result.error}`);
        }
      }

      setLocalizations(newLocalizations);
      const successMarkets = Object.keys(newLocalizations);
      if (successMarkets.length > 0) {
        setActiveTab(markets?.[0] || successMarkets[0]);
        setShowMarketSelection(false);
      }

      toast.success(
        `Localized to ${marketsToLocalize.length} market${marketsToLocalize.length > 1 ? "s" : ""}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to localize",
      );
    } finally {
      setLocalizing(false);
      setLocalizingMarkets(new Set());
    }
  }

  // ─── State A: Card Grid ───────────────────────────────────────────────
  if (!activeScript) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Localize
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Scripts marked for localization appear here. Select target markets
            and localize with cultural context.
          </p>

          {!loaded ? (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-4 w-3/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-4 w-10 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <div className="h-5 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-5 w-14 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    <div className="h-5 w-20 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                  <div className="mt-4 h-7 w-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : scripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <GlobeHemisphereWest
                size={40}
                className="text-zinc-200 dark:text-zinc-800"
              />
              <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">
                No scripts ready for localization
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                Open a script and click &quot;Mark for localization&quot; to add
                it here
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {scripts.map((script) => {
                const formatMatch = script.content.match(
                  /\*Format:\s*([^|*]+)/,
                );
                const durationMatch = script.content.match(
                  /Duration:\s*([^|*]+)/,
                );
                const dateStr = new Date(
                  script.updated_at || script.created_at,
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <div
                    key={script.id}
                    className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {script.title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Localize
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {dateStr}
                      </span>
                      {formatMatch && (
                        <span className="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                          {formatMatch[1].trim()}
                        </span>
                      )}
                      {durationMatch && (
                        <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                          {durationMatch[1].trim()}
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => openScript(script)}
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        Open script
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── State B & C: Detail View ─────────────────────────────────────────
  const hasResults = Object.keys(localizations).length > 0 && !showMarketSelection;

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-5 py-2.5 dark:border-zinc-800">
        <button
          onClick={closeScript}
          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {activeScript.title}
          </h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
            Last edited{" "}
            {new Date(
              activeScript.updated_at || activeScript.created_at,
            ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: original script */}
        <div className="flex-1 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
          <ScriptEditor
            key={`localize-original-${activeScript.id}`}
            initialContent={activeScript.content}
            editable={false}
          />
        </div>

        {/* Right panel */}
        <div className="flex w-80 shrink-0 flex-col overflow-hidden">
          {loadingExisting ? (
            <div className="flex flex-1 items-center justify-center">
              <CircleNotch
                size={16}
                className="animate-spin text-zinc-300 dark:text-zinc-700"
              />
            </div>
          ) : hasResults ? (
            /* ─── State C: Tabbed results ─── */
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Market tabs */}
              <div className="flex shrink-0 flex-wrap gap-1 border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
                {Object.keys(localizations).map((market) => {
                  const country = COUNTRIES.find((c) => c.code === market);
                  return (
                    <button
                      key={market}
                      onClick={() => setActiveTab(market)}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                        activeTab === market
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {country?.flag} {market}
                    </button>
                  );
                })}
              </div>

              {/* Active localization content */}
              {activeTab && localizations[activeTab] && (
                <div className="flex-1 overflow-y-auto">
                  <ScriptEditor
                    key={`localized-${activeScript.id}-${activeTab}`}
                    initialContent={localizations[activeTab].content}
                    editable={false}
                  />
                </div>
              )}

              {/* Bottom actions */}
              <div className="shrink-0 border-t border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMarketSelection(true)}
                    className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <Plus size={10} />
                    Add more markets
                  </button>
                  {activeTab && (
                    <button
                      onClick={() => handleLocalize([activeTab])}
                      disabled={localizing}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    >
                      {localizingMarkets.has(activeTab) ? (
                        <CircleNotch size={10} className="animate-spin" />
                      ) : (
                        <ArrowCounterClockwise size={10} />
                      )}
                      Re-localize
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ─── State B: Market selection ─── */
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="shrink-0 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                  Target markets
                </h3>
                <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-600">
                  Select markets to localize this script for
                </p>
              </div>

              {availableMarkets.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-4">
                  <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
                    No target markets configured. Set them up in your brand
                    image.
                  </p>
                </div>
              ) : (
                <>
                  {/* Select all */}
                  <div className="shrink-0 border-b border-zinc-100 px-4 py-2 dark:border-zinc-800/50">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={
                          selectedMarkets.size === availableMarkets.length &&
                          availableMarkets.length > 0
                        }
                        onChange={toggleAll}
                        className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                      />
                      <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                        Select all
                      </span>
                    </label>
                  </div>

                  {/* Market list */}
                  <div className="flex-1 overflow-y-auto">
                    {availableMarkets.map((country) => (
                      <label
                        key={country.code}
                        className="flex cursor-pointer items-center gap-2.5 px-4 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMarkets.has(country.code)}
                          onChange={() => toggleMarket(country.code)}
                          className="h-3.5 w-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                        />
                        <span className="text-sm">{country.flag}</span>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300">
                          {country.label}
                        </span>
                        {localizingMarkets.has(country.code) && (
                          <CircleNotch
                            size={12}
                            className="ml-auto animate-spin text-zinc-400"
                          />
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Localize button */}
                  <div className="shrink-0 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                    {Object.keys(localizations).length > 0 && (
                      <button
                        onClick={() => setShowMarketSelection(false)}
                        className="mb-2 w-full rounded-lg border border-zinc-200 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        Back to results
                      </button>
                    )}
                    <button
                      onClick={() => handleLocalize()}
                      disabled={selectedMarkets.size === 0 || localizing}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {localizing ? (
                        <>
                          <CircleNotch size={12} className="animate-spin" />
                          Localizing...
                        </>
                      ) : (
                        <>
                          <GlobeHemisphereWest size={12} weight="fill" />
                          Localize {selectedMarkets.size > 0 ? `(${selectedMarkets.size})` : "selected"}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
