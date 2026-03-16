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

interface ParsedCite {
  phrase: string;
  reason: string;
}

/**
 * Tokenize a line into text chunks and citation placeholders.
 * Handles **bold** that spans across citations by tracking bold state.
 * Unescapes \[ and \] for proper bracket rendering.
 *
 * Key fix: only highlights the phrase immediately before ()[reason],
 * not the entire preceding text. Phrase boundary = last punctuation
 * (, . : ; " " ") before the ().
 */
function tokenizeLine(raw: string, lineIdx: number): React.ReactNode[] {
  // Step 1: Unescape markdown brackets
  let line = raw.replace(/\\\[/g, "[").replace(/\\\]/g, "]");

  // Step 2: Find all ()[reason] markers, extract just the nearby phrase
  const cites: ParsedCite[] = [];
  const markerRegex = /\(\)\[([^\]]+)\]/g;
  const markers: { start: number; end: number; reason: string }[] = [];
  let m;
  while ((m = markerRegex.exec(line)) !== null) {
    markers.push({ start: m.index, end: m.index + m[0].length, reason: m[1].trim() });
  }

  // Build processed line: prefix text stays as-is, phrase becomes placeholder
  let processed = "";
  let lastEnd = 0;

  for (const marker of markers) {
    const textBefore = line.slice(lastEnd, marker.start);

    // Find phrase boundary — look backward for punctuation or quote
    const boundaryRegex = /[,.:;!?"""'']\s*/g;
    let boundaryEnd = 0;
    let bm;
    while ((bm = boundaryRegex.exec(textBefore)) !== null) {
      boundaryEnd = bm.index + bm[0].length;
    }

    const prefix = textBefore.slice(0, boundaryEnd);
    const phrase = textBefore.slice(boundaryEnd).trim();

    const citeIdx = cites.length;
    cites.push({ phrase: phrase || "(adapted)", reason: marker.reason });
    processed += prefix + `\x00C${citeIdx}\x00`;
    lastEnd = marker.end;
  }

  processed += line.slice(lastEnd);

  // Step 3: Split by ** markers AND citation placeholders, track bold state
  const parts = processed.split(/(\*\*|\x00C\d+\x00)/);
  const nodes: React.ReactNode[] = [];
  let bold = false;
  let nodeKey = 0;

  for (const part of parts) {
    if (part === "**") {
      bold = !bold;
      continue;
    }

    const citeMatch = part.match(/^\x00C(\d+)\x00$/);
    if (citeMatch) {
      const cite = cites[parseInt(citeMatch[1])];
      nodes.push(
        <span key={`${lineIdx}-c${nodeKey++}`} className="group/cite relative inline">
          <span className="inline rounded-sm bg-amber-50 px-0.5 text-amber-900 decoration-amber-300/60 decoration-wavy decoration-[1px] underline underline-offset-[3px] dark:bg-amber-900/20 dark:text-amber-200 dark:decoration-amber-600/40">
            {bold ? (
              <strong className="font-semibold">{cite.phrase}</strong>
            ) : (
              cite.phrase
            )}
            <sup className="relative -top-1 ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-200 text-[8px] font-bold text-amber-700 dark:bg-amber-800 dark:text-amber-300">
              i
            </sup>
          </span>
          {/* Hover tooltip */}
          <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-normal opacity-0 transition-all duration-200 group-hover/cite:pointer-events-auto group-hover/cite:opacity-100">
            <span className="block w-72 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-2xl dark:border-zinc-700 dark:bg-zinc-800">
              <span className="block text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                Cultural adaptation
              </span>
              <span className="mt-1 block text-[11px] font-normal leading-relaxed text-zinc-500 dark:text-zinc-400">
                {cite.reason}
              </span>
            </span>
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-white dark:border-t-zinc-800" />
          </span>
        </span>,
      );
      continue;
    }

    if (!part) continue;

    // Regular text — render with bold state and inline *italic* / `code`
    const inlineParts = part.split(/(\*[^*]+\*|`[^`]+`)/);
    for (const ip of inlineParts) {
      if (!ip) continue;

      const italicMatch = ip.match(/^\*([^*]+)\*$/);
      const codeMatch = ip.match(/^`([^`]+)`$/);

      let content: React.ReactNode = ip;

      if (italicMatch) {
        content = (
          <em className="text-zinc-500 dark:text-zinc-400">{italicMatch[1]}</em>
        );
      } else if (codeMatch) {
        content = (
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-[0.8125rem] font-mono dark:bg-zinc-800">
            {codeMatch[1]}
          </code>
        );
      }

      if (bold && !codeMatch) {
        nodes.push(
          <strong
            key={`${lineIdx}-t${nodeKey++}`}
            className="font-semibold text-zinc-900 dark:text-zinc-100"
          >
            {content}
          </strong>,
        );
      } else {
        nodes.push(
          <span key={`${lineIdx}-t${nodeKey++}`}>{content}</span>,
        );
      }
    }
  }

  return nodes;
}

function AnnotatedBackTranslation({ content }: { content: string }) {
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];
  let listBuffer: { text: string; idx: number; ordered: boolean }[] = [];

  function flushList() {
    if (listBuffer.length === 0) return;
    const ordered = listBuffer[0].ordered;
    const Tag = ordered ? "ol" : "ul";
    elements.push(
      <Tag
        key={`list-${listBuffer[0].idx}`}
        className={ordered ? "list-decimal pl-5 my-1" : "list-disc pl-5 my-1"}
      >
        {listBuffer.map((item) => (
          <li
            key={item.idx}
            className="text-[0.9375rem] text-zinc-600 dark:text-zinc-400"
          >
            {tokenizeLine(item.text, item.idx)}
          </li>
        ))}
      </Tag>,
    );
    listBuffer = [];
  }

  lines.forEach((line, lineIdx) => {
    const ulMatch = line.match(/^[\s]*[-+]\s+(.*)/);
    const olMatch = line.match(/^[\s]*(\d+)[.)]\s+(.*)/);

    if (ulMatch) {
      if (listBuffer.length > 0 && listBuffer[0].ordered) flushList();
      listBuffer.push({ text: ulMatch[1], idx: lineIdx, ordered: false });
      return;
    }
    if (olMatch) {
      if (listBuffer.length > 0 && !listBuffer[0].ordered) flushList();
      listBuffer.push({ text: olMatch[2], idx: lineIdx, ordered: true });
      return;
    }

    flushList();

    // Block-level markdown
    if (line.startsWith("### ")) {
      elements.push(<h3 key={lineIdx}>{tokenizeLine(line.slice(4), lineIdx)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={lineIdx}>{tokenizeLine(line.slice(3), lineIdx)}</h2>);
    } else if (line.startsWith("# ")) {
      elements.push(<h1 key={lineIdx}>{tokenizeLine(line.slice(2), lineIdx)}</h1>);
    } else if (/^---+$|^\*\*\*+$/.test(line.trim())) {
      elements.push(
        <hr key={lineIdx} className="my-6 border-zinc-200 dark:border-zinc-800" />,
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={lineIdx}
          className="border-l-2 border-zinc-300 pl-4 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
        >
          <p>{tokenizeLine(line.slice(2), lineIdx)}</p>
        </blockquote>,
      );
    } else if (line.trim() === "") {
      elements.push(<br key={lineIdx} />);
    } else {
      elements.push(<p key={lineIdx}>{tokenizeLine(line, lineIdx)}</p>);
    }
  });

  flushList();

  return (
    <div className="px-6 py-4">
      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-zinc-900 dark:prose-headings:text-zinc-50 prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-[1.875rem] prose-h1:font-bold prose-h1:leading-tight prose-h1:mt-8 prose-h1:mb-1 prose-h2:text-[1.25rem] prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-1 prose-h3:text-[1rem] prose-h3:font-medium prose-h3:mt-4 prose-h3:mb-0.5 prose-p:text-[0.9375rem] prose-p:leading-[1.75] prose-p:my-0.5 prose-li:text-[0.9375rem] prose-strong:font-semibold prose-ul:my-1 prose-ol:my-1">
        {elements}
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
  const [activeTab, setActiveTab] = useState<"original" | "localized" | "back">("original");

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
  const unlocalizedMarkets = availableMarkets.filter((c) => !localizations[c.code]);

  function toggleAll() {
    if (selectedMarkets.size === unlocalizedMarkets.length) {
      setSelectedMarkets(new Set());
    } else {
      setSelectedMarkets(new Set(unlocalizedMarkets.map((m) => m.code)));
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
      // Auto-switch to localized tab after completion
      setActiveTab("localized");
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
                  title={country?.label || market}
                  className={`group/tab relative flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    activeMarket === market
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Flag code={market} size={12} />
                  {market}
                  {/* Hover tooltip */}
                  <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tab:opacity-100 dark:bg-zinc-100 dark:text-zinc-900">
                    {country?.label || market}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-zinc-900 dark:border-b-zinc-100" />
                  </span>
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
                      {selectedMarkets.size === unlocalizedMarkets.length
                        ? "Deselect all"
                        : "Select all"}
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto py-1">
                  {(() => {
                    const unlocalized = availableMarkets.filter(
                      (c) => !localizations[c.code],
                    );
                    if (availableMarkets.length === 0) {
                      return (
                        <p className="px-3 py-4 text-center text-[11px] text-zinc-400">
                          No target markets configured in brand image
                        </p>
                      );
                    }
                    if (unlocalized.length === 0) {
                      return (
                        <p className="px-3 py-4 text-center text-[11px] text-zinc-400">
                          All markets have been localized
                        </p>
                      );
                    }
                    return unlocalized.map((country) => (
                      <label
                        key={country.code}
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMarkets.has(country.code)}
                          onChange={() => toggleMarket(country.code)}
                          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                        />
                        <Flag code={country.code} size={16} />
                        <span className="text-[12px] text-zinc-700 dark:text-zinc-300">
                          {country.label}
                        </span>
                        {localizingMarkets.has(country.code) && (
                          <CircleNotch
                            size={12}
                            className="ml-auto animate-spin text-zinc-400"
                          />
                        )}
                      </label>
                    ));
                  })()}
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

      {/* Single-panel view with tabs */}
      <div className="flex flex-1 flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        {/* View tabs */}
        <div className="flex shrink-0 items-center gap-1 px-4 pt-3 pb-0">
          <button
            onClick={() => setActiveTab("original")}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === "original"
                ? "bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
          >
            <Flag code="US" size={12} />
            Original
          </button>
          <button
            onClick={() => activeLoc && setActiveTab("localized")}
            disabled={!activeLoc}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-30 ${
              activeTab === "localized"
                ? "bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
          >
            {activeMarket && <Flag code={activeMarket} size={12} />}
            {activeLoc
              ? `Localized — ${activeCountry?.label}`
              : "Localized"}
          </button>
          <button
            onClick={() => activeLoc && setActiveTab("back")}
            disabled={!activeLoc}
            className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-xs font-medium transition-colors disabled:opacity-30 ${
              activeTab === "back"
                ? "bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
            }`}
          >
            <Flag code="US" size={12} />
            {activeMarket && (
              <>
                <ArrowLeft size={8} className="text-zinc-300 dark:text-zinc-600" />
                <Flag code={activeMarket} size={12} />
              </>
            )}
            Back-translation
          </button>
        </div>

        {/* Content panel */}
        <div className="mx-3 mb-3 flex flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex-1 overflow-y-auto">
            {/* Loading state */}
            {loadingExisting ? (
              <div className="flex h-full items-center justify-center">
                <CircleNotch size={16} className="animate-spin text-zinc-300 dark:text-zinc-700" />
              </div>
            ) : localizing && !activeLoc ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <CircleNotch size={16} className="mx-auto animate-spin text-zinc-300 dark:text-zinc-700" />
                  <p className="mt-2 text-xs text-zinc-400">
                    {activeTab === "back" ? "Translating back..." : "Localizing..."}
                  </p>
                </div>
              </div>
            ) : activeTab === "original" ? (
              <ScriptEditor
                key={`original-${script.id}`}
                initialContent={script.content}
                editable={false}
              />
            ) : activeTab === "localized" ? (
              activeLoc ? (
                <ScriptEditor
                  key={`localized-${script.id}-${activeMarket}`}
                  initialContent={activeLoc.content}
                  editable={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="px-6 text-center">
                    <GlobeHemisphereWest size={24} className="mx-auto text-zinc-200 dark:text-zinc-700" />
                    <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                      Select markets and click Localize to see translated scripts
                    </p>
                  </div>
                </div>
              )
            ) : activeTab === "back" ? (
              activeLoc?.back_translation ? (
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
                    <ArrowCounterClockwise size={24} className="mx-auto text-zinc-200 dark:text-zinc-700" />
                    <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                      The localized script translated back to English with annotated cultural changes
                    </p>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
