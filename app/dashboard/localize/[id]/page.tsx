"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import ReactCountryFlag from "react-country-flag";
import {
  GlobeHemisphereWest,
  ArrowLeft,
  CircleNotch,
  ArrowCounterClockwise,
  Plus,
  Info,
} from "@phosphor-icons/react";
import ScriptEditor from "../../components/ScriptEditor";
import { useDashboard } from "../../layout";

interface Script {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  ready_to_localize?: boolean;
  localized_markets?: string[];
}

interface Localization {
  market_code: string;
  locale: string;
  content: string;
  back_translation: string;
}

const COUNTRIES = [
  { code: "IN", label: "India", countryCode: "IN" },
  { code: "US", label: "United States", countryCode: "US" },
  { code: "BR", label: "Brazil", countryCode: "BR" },
  { code: "ID", label: "Indonesia", countryCode: "ID" },
  { code: "MX", label: "Mexico", countryCode: "MX" },
  { code: "VN", label: "Vietnam", countryCode: "VN" },
  { code: "RU", label: "Russia", countryCode: "RU" },
  { code: "TR", label: "Turkey", countryCode: "TR" },
  { code: "JP", label: "Japan", countryCode: "JP" },
  { code: "UK", label: "United Kingdom", countryCode: "GB" },
  { code: "DE", label: "Germany", countryCode: "DE" },
  { code: "KR", label: "South Korea", countryCode: "KR" },
  { code: "FR", label: "France", countryCode: "FR" },
  { code: "CA", label: "Canada", countryCode: "CA" },
  { code: "AU", label: "Australia", countryCode: "AU" },
];

function Flag({ code, size = 14 }: { code: string; size?: number }) {
  const country = COUNTRIES.find((c) => c.code === code);
  if (!country) return null;
  return (
    <ReactCountryFlag
      countryCode={country.countryCode}
      svg
      style={{ width: size, height: size }}
      className="rounded-sm object-cover"
    />
  );
}

// ─── Citation parser & renderer ────────────────────────────────────────

interface CitationSegment {
  type: "text" | "citation";
  text: string;
  reason?: string;
}

function parseCitations(text: string): CitationSegment[] {
  const segments: CitationSegment[] = [];
  const regex = /([^()]*?)\s*\(\)\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const preText = text.slice(lastIndex, match.index);
    if (preText) {
      segments.push({ type: "text", text: preText });
    }
    segments.push({
      type: "citation",
      text: match[1].trim(),
      reason: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  const remaining = text.slice(lastIndex);
  if (remaining) {
    segments.push({ type: "text", text: remaining });
  }

  return segments;
}

function AnnotatedBackTranslation({ content }: { content: string }) {
  const lines = content.split("\n");
  const [expandedCitation, setExpandedCitation] = useState<string | null>(null);

  const hasCitations = content.includes("()[");

  return (
    <div className="px-6 py-4">
      {hasCitations && (
        <div className="mb-4 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 dark:bg-amber-900/20">
          <Info size={12} className="shrink-0 text-amber-500" />
          <span className="text-[10px] text-amber-700 dark:text-amber-400">
            Highlighted phrases were culturally adapted. Click to see why.
          </span>
        </div>
      )}
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-zinc-900 dark:prose-headings:text-zinc-50 prose-p:text-zinc-700 dark:prose-p:text-zinc-300">
        {lines.map((line, lineIdx) => {
          const segments = parseCitations(line);
          const hasCitationsInLine = segments.some((s) => s.type === "citation");

          if (!hasCitationsInLine) {
            if (line.startsWith("# ")) return <h1 key={lineIdx}>{line.slice(2)}</h1>;
            if (line.startsWith("## ")) return <h2 key={lineIdx}>{line.slice(3)}</h2>;
            if (line.startsWith("### ")) return <h3 key={lineIdx}>{line.slice(4)}</h3>;
            if (line.startsWith("**") && line.endsWith("**"))
              return (
                <p key={lineIdx}>
                  <strong>{line.slice(2, -2)}</strong>
                </p>
              );
            if (line.trim() === "") return <br key={lineIdx} />;
            return <p key={lineIdx}>{line}</p>;
          }

          return (
            <p key={lineIdx}>
              {segments.map((seg, segIdx) => {
                if (seg.type === "text") return <span key={segIdx}>{seg.text}</span>;

                const citationId = `${lineIdx}-${segIdx}`;
                const isExpanded = expandedCitation === citationId;

                return (
                  <span key={segIdx} className="relative inline">
                    <button
                      onClick={() => setExpandedCitation(isExpanded ? null : citationId)}
                      className="relative inline rounded-sm bg-amber-100 px-0.5 text-amber-900 underline decoration-amber-300 decoration-wavy decoration-[1px] underline-offset-2 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:decoration-amber-600 dark:hover:bg-amber-900/60"
                    >
                      {seg.text}
                      <sup className="ml-0.5 text-[8px] font-bold text-amber-500">*</sup>
                    </button>
                    {isExpanded && (
                      <span className="absolute left-0 top-full z-10 mt-1 block w-64 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shadow-lg dark:border-amber-800 dark:bg-amber-950">
                        <span className="block text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                          Cultural adaptation
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                          {seg.reason}
                        </span>
                      </span>
                    )}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────

export default function LocalizeScriptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useDashboard();
  const brandImage = profile?.brandImage?.full_brand_image;
  const targetMarkets = brandImage?.target_markets || [];

  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [localizing, setLocalizing] = useState(false);
  const [localizingMarkets, setLocalizingMarkets] = useState<Set<string>>(new Set());
  const [localizations, setLocalizations] = useState<Record<string, Localization>>({});
  const [activeMarket, setActiveMarket] = useState<string>("");
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [showMarketPicker, setShowMarketPicker] = useState(false);

  // Fetch script
  useEffect(() => {
    if (!id) return;
    fetch(`/api/scripts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setScript(data))
      .catch(() => {
        toast.error("Script not found");
        router.push("/dashboard/localize");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  // Fetch existing localizations
  useEffect(() => {
    if (!script) return;
    setLoadingExisting(true);
    fetch(`/api/localize?scriptId=${script.id}`)
      .then((res) => res.json())
      .then((data) => {
        const existing = data.localizations || [];
        if (existing.length > 0) {
          const map: Record<string, Localization> = {};
          for (const loc of existing) {
            map[loc.market_code] = loc;
          }
          setLocalizations(map);
          setActiveMarket(existing[0].market_code);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  }, [script]);

  function toggleMarket(code: string) {
    setSelectedMarkets((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const availableMarkets = COUNTRIES.filter((c) => targetMarkets.includes(c.code));

  function toggleAll() {
    if (selectedMarkets.size === availableMarkets.length) {
      setSelectedMarkets(new Set());
    } else {
      setSelectedMarkets(new Set(availableMarkets.map((m) => m.code)));
    }
  }

  async function handleLocalize(markets?: string[]) {
    if (!script) return;
    const marketsToLocalize = markets || Array.from(selectedMarkets);
    if (marketsToLocalize.length === 0) return;

    setLocalizing(true);
    setLocalizingMarkets(new Set(marketsToLocalize));
    setShowMarketPicker(false);

    // Show a loading toast per market
    const toastIds: Record<string, string | number> = {};
    for (const code of marketsToLocalize) {
      const country = COUNTRIES.find((c) => c.code === code);
      const label = country?.label || code;
      toastIds[code] = toast.loading(`Processing "${script.title}" for ${label}...`);
    }

    try {
      const res = await fetch("/api/localize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptId: script.id,
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
          {
            locale: string;
            content: string;
            backTranslation: string;
            success: boolean;
            error?: string;
          }
        >,
      )) {
        const country = COUNTRIES.find((c) => c.code === market);
        const label = country?.label || market;

        if (result.success) {
          newLocalizations[market] = {
            market_code: market,
            locale: result.locale,
            content: result.content,
            back_translation: result.backTranslation,
          };
          toast.success(`${label} localization complete`, { id: toastIds[market] });
        } else {
          toast.error(`Failed to localize for ${label}: ${result.error}`, { id: toastIds[market] });
        }
      }

      setLocalizations(newLocalizations);
      if (!activeMarket || !newLocalizations[activeMarket]) {
        const firstMarket = marketsToLocalize.find((m) => newLocalizations[m]);
        if (firstMarket) setActiveMarket(firstMarket);
      }
    } catch (err) {
      // Dismiss all loading toasts on error
      for (const code of marketsToLocalize) {
        const country = COUNTRIES.find((c) => c.code === code);
        const label = country?.label || code;
        toast.error(`Failed to localize for ${label}`, { id: toastIds[code] });
      }
    } finally {
      setLocalizing(false);
      setLocalizingMarkets(new Set());
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <CircleNotch size={24} className="animate-spin text-zinc-300 dark:text-zinc-700" />
      </div>
    );
  }

  if (!script) return null;

  const hasLocalizations = Object.keys(localizations).length > 0;
  const activeLoc = activeMarket ? localizations[activeMarket] : null;
  const activeCountry = COUNTRIES.find((c) => c.code === activeMarket);

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-5 py-2.5 dark:border-zinc-800">
        <button
          onClick={() => router.push("/dashboard/localize")}
          className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {script.title}
          </h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
            Last edited{" "}
            {new Date(script.updated_at || script.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Market tabs + actions in top bar */}
        <div className="flex items-center gap-1.5">
          {hasLocalizations &&
            Object.keys(localizations).map((market) => {
              const country = COUNTRIES.find((c) => c.code === market);
              return (
                <button
                  key={market}
                  onClick={() => setActiveMarket(market)}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    activeMarket === market
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Flag code={market} size={12} />
                  {market}
                </button>
              );
            })}

          {/* Add market button */}
          <div className="relative">
            <button
              onClick={() => setShowMarketPicker(!showMarketPicker)}
              className="flex items-center gap-1 rounded-md border border-dashed border-zinc-300 px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
            >
              <Plus size={10} />
              {hasLocalizations ? "Add" : "Localize"}
            </button>

            {/* Market picker dropdown */}
            {showMarketPicker && (
              <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Target markets
                    </span>
                    <button
                      onClick={toggleAll}
                      className="text-[10px] font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    >
                      {selectedMarkets.size === availableMarkets.length
                        ? "Deselect all"
                        : "Select all"}
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto py-1">
                  {availableMarkets.length === 0 ? (
                    <p className="px-3 py-4 text-center text-[11px] text-zinc-400">
                      No target markets configured in brand image
                    </p>
                  ) : (
                    availableMarkets.map((country) => (
                      <label
                        key={country.code}
                        className="flex cursor-pointer items-center gap-2 px-3 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMarkets.has(country.code)}
                          onChange={() => toggleMarket(country.code)}
                          className="h-3 w-3 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                        />
                        <Flag code={country.code} size={14} />
                        <span className="text-[11px] text-zinc-700 dark:text-zinc-300">
                          {country.label}
                        </span>
                        {localizingMarkets.has(country.code) && (
                          <CircleNotch
                            size={10}
                            className="ml-auto animate-spin text-zinc-400"
                          />
                        )}
                        {localizations[country.code] &&
                          !localizingMarkets.has(country.code) && (
                            <span className="ml-auto text-[9px] text-emerald-500">done</span>
                          )}
                      </label>
                    ))
                  )}
                </div>

                <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
                  <button
                    onClick={() => handleLocalize()}
                    disabled={selectedMarkets.size === 0 || localizing}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {localizing ? (
                      <>
                        <CircleNotch size={10} className="animate-spin" />
                        Localizing...
                      </>
                    ) : (
                      <>
                        <GlobeHemisphereWest size={10} weight="fill" />
                        Localize{selectedMarkets.size > 0 ? ` (${selectedMarkets.size})` : ""}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Re-localize active market */}
          {activeLoc && (
            <button
              onClick={() => handleLocalize([activeMarket])}
              disabled={localizing}
              className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {localizingMarkets.has(activeMarket) ? (
                <CircleNotch size={10} className="animate-spin" />
              ) : (
                <ArrowCounterClockwise size={10} />
              )}
              Re-localize
            </button>
          )}
        </div>
      </div>

      {/* Three-column canvas */}
      <div className="flex flex-1 overflow-hidden bg-zinc-100 p-3 dark:bg-zinc-900">
        {/* Column 1: Original English */}
        <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-100 px-4 py-2 dark:border-zinc-800/50">
            <Flag code="US" size={12} />
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Original (English)
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ScriptEditor
              key={`original-${script.id}`}
              initialContent={script.content}
              editable={false}
            />
          </div>
        </div>

        <div className="w-3 shrink-0" />

        {/* Column 2: Localized version */}
        <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-100 px-4 py-2 dark:border-zinc-800/50">
            {activeMarket && <Flag code={activeMarket} size={12} />}
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {activeLoc
                ? `Localized \u2014 ${activeCountry?.label} (${activeLoc.locale})`
                : "Localized"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingExisting ? (
              <div className="flex h-full items-center justify-center">
                <CircleNotch
                  size={16}
                  className="animate-spin text-zinc-300 dark:text-zinc-700"
                />
              </div>
            ) : localizing && !activeLoc ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <CircleNotch
                    size={16}
                    className="mx-auto animate-spin text-zinc-300 dark:text-zinc-700"
                  />
                  <p className="mt-2 text-xs text-zinc-400">Localizing...</p>
                </div>
              </div>
            ) : activeLoc ? (
              <ScriptEditor
                key={`localized-${script.id}-${activeMarket}`}
                initialContent={activeLoc.content}
                editable={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="px-6 text-center">
                  <GlobeHemisphereWest
                    size={24}
                    className="mx-auto text-zinc-200 dark:text-zinc-700"
                  />
                  <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    Select markets and click Localize to see translated scripts
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-3 shrink-0" />

        {/* Column 3: Back-translation with citations */}
        <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-100 px-4 py-2 dark:border-zinc-800/50">
            <Flag code="US" size={12} />
            {activeMarket && (
              <>
                <ArrowLeft size={8} className="text-zinc-300 dark:text-zinc-600" />
                <Flag code={activeMarket} size={12} />
              </>
            )}
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              {activeLoc ? "Back to English" : "Back-translation"}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingExisting ? (
              <div className="flex h-full items-center justify-center">
                <CircleNotch
                  size={16}
                  className="animate-spin text-zinc-300 dark:text-zinc-700"
                />
              </div>
            ) : localizing && !activeLoc ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <CircleNotch
                    size={16}
                    className="mx-auto animate-spin text-zinc-300 dark:text-zinc-700"
                  />
                  <p className="mt-2 text-xs text-zinc-400">Translating back...</p>
                </div>
              </div>
            ) : activeLoc?.back_translation ? (
              <AnnotatedBackTranslation content={activeLoc.back_translation} />
            ) : activeLoc ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Back-translation not available
                </p>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="px-6 text-center">
                  <ArrowCounterClockwise
                    size={24}
                    className="mx-auto text-zinc-200 dark:text-zinc-700"
                  />
                  <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                    The localized script translated back to English with annotated cultural
                    changes
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
