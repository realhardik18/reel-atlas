"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import { GlobeHemisphereWest } from "@phosphor-icons/react";
import { useDashboard } from "../layout";

interface Script {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  ready_to_localize?: boolean;
  localized_markets?: string[];
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

export default function LocalizePage() {
  const router = useRouter();
  const { profile } = useDashboard();

  const [scripts, setScripts] = useState<Script[]>([]);
  const [loaded, setLoaded] = useState(false);

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

                  {/* Already localized markets */}
                  {script.localized_markets && script.localized_markets.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex items-center -space-x-1">
                        {script.localized_markets.slice(0, 5).map((code) => (
                          <div
                            key={code}
                            title={COUNTRIES.find((c) => c.code === code)?.label}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-zinc-100 dark:border-zinc-900 dark:bg-zinc-800"
                          >
                            <Flag code={code} size={12} />
                          </div>
                        ))}
                        {script.localized_markets.length > 5 && (
                          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-zinc-100 text-[8px] font-bold text-zinc-500 dark:border-zinc-900 dark:bg-zinc-800">
                            +{script.localized_markets.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                        {script.localized_markets.length} localized
                      </span>
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      onClick={() => router.push(`/dashboard/localize/${script.id}`)}
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
