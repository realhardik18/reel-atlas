"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  PaperPlaneRight,
  Sparkle,
  CircleNotch,
  CheckCircle,
  Globe,
  FileMagnifyingGlass,
  ChatTeardropDots,
  FilmSlate,
} from "@phosphor-icons/react";
import ReactCountryFlag from "react-country-flag";
import BrandImageEditor from "./components/BrandImageEditor";
import { useDashboard } from "./layout";

interface MCQuestion {
  question: string;
  options: string[];
}

interface ChatMessage {
  role: "bot" | "user";
  content: string;
  type?: "text" | "loading" | "steps" | "mcq" | "countries";
  mcq?: MCQuestion;
}

interface Script {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  ready_to_localize?: boolean;
  localized_markets?: string[];
}

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

const COUNTRIES = [
  { code: "IN", label: "India", flag: "\u{1F1EE}\u{1F1F3}", countryCode: "IN" },
  { code: "US", label: "United States", flag: "\u{1F1FA}\u{1F1F8}", countryCode: "US" },
  { code: "BR", label: "Brazil", flag: "\u{1F1E7}\u{1F1F7}", countryCode: "BR" },
  { code: "ID", label: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}", countryCode: "ID" },
  { code: "MX", label: "Mexico", flag: "\u{1F1F2}\u{1F1FD}", countryCode: "MX" },
  { code: "VN", label: "Vietnam", flag: "\u{1F1FB}\u{1F1F3}", countryCode: "VN" },
  { code: "RU", label: "Russia", flag: "\u{1F1F7}\u{1F1FA}", countryCode: "RU" },
  { code: "TR", label: "Turkey", flag: "\u{1F1F9}\u{1F1F7}", countryCode: "TR" },
  { code: "JP", label: "Japan", flag: "\u{1F1EF}\u{1F1F5}", countryCode: "JP" },
  { code: "UK", label: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}", countryCode: "GB" },
  { code: "DE", label: "Germany", flag: "\u{1F1E9}\u{1F1EA}", countryCode: "DE" },
  { code: "KR", label: "South Korea", flag: "\u{1F1F0}\u{1F1F7}", countryCode: "KR" },
  { code: "FR", label: "France", flag: "\u{1F1EB}\u{1F1F7}", countryCode: "FR" },
  { code: "CA", label: "Canada", flag: "\u{1F1E8}\u{1F1E6}", countryCode: "CA" },
  { code: "AU", label: "Australia", flag: "\u{1F1E6}\u{1F1FA}", countryCode: "AU" },
];

const SCRAPE_STEPS = [
  { icon: Globe, text: "Crawling website..." },
  { icon: FileMagnifyingGlass, text: "Fetching content..." },
  { icon: ChatTeardropDots, text: "Preparing questions for you..." },
];

// ─── Loading Dots ───────────────────────────────────────────────────────────

function LoadingDots({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{text}</span>
      <span className="flex gap-1">
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
      </span>
    </div>
  );
}

// ─── Step Loading Animation ─────────────────────────────────────────────────

function StepLoader() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1 < SCRAPE_STEPS.length ? s + 1 : s));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2.5 py-1">
      {SCRAPE_STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = i === activeStep;
        const isDone = i < activeStep;
        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 transition-all duration-500 ${
              isDone
                ? "text-zinc-400 dark:text-zinc-600"
                : isActive
                  ? "text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-300 dark:text-zinc-700"
            }`}
          >
            {isDone ? (
              <CheckCircle size={16} weight="fill" className="shrink-0 text-emerald-500" />
            ) : isActive ? (
              <Icon size={16} weight="duotone" className="shrink-0 animate-pulse" />
            ) : (
              <Icon size={16} className="shrink-0" />
            )}
            <span className={`text-sm ${isDone ? "line-through" : ""} ${isActive ? "font-medium" : ""}`}>
              {step.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Onboarding Chat ────────────────────────────────────────────────────────

function OnboardingChat({ onComplete }: { onComplete: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content:
        "Hey! I'm your brand strategist. Let's build your brand image. Paste your brand URL to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<
    "url" | "scraping" | "questions" | "countries" | "generating" | "done"
  >("url");
  const [questions, setQuestions] = useState<MCQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<
    { question: string; answer: string }[]
  >([]);
  const [scrapedData, setScrapedData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [brandUrl, setBrandUrl] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedCountries, scrollToBottom]);

  async function handleUrlSubmit() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setBrandUrl(text);
    setStep("scraping");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "bot", content: "", type: "steps" },
    ]);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setScrapedData(data.scrapedData);
      setQuestions(data.questions);
      setStep("questions");
      setCurrentQ(0);
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "steps"),
        {
          role: "bot",
          content:
            "Got it! I've analyzed your site. Let me ask a few quick questions to personalize your brand image.",
        },
        {
          role: "bot",
          content: data.questions[0].question,
          type: "mcq",
          mcq: data.questions[0],
        },
      ]);
    } catch {
      setStep("url");
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "steps"),
        {
          role: "bot",
          content:
            "Something went wrong analyzing that URL. Please try again.",
        },
      ]);
    }
  }

  function handleOptionSelect(option: string) {
    if (step !== "questions") return;

    const newAnswers = [
      ...answers,
      { question: questions[currentQ].question, answer: option },
    ];
    setAnswers(newAnswers);

    if (currentQ + 1 < questions.length) {
      const nextQ = currentQ + 1;
      setCurrentQ(nextQ);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: option },
        {
          role: "bot",
          content: questions[nextQ].question,
          type: "mcq",
          mcq: questions[nextQ],
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: option },
        {
          role: "bot",
          content:
            "Last one \u2014 which countries would you like to market in? Select all that apply.",
          type: "countries",
        },
      ]);
      setStep("countries");
    }
  }

  function toggleCountry(code: string) {
    setSelectedCountries((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code],
    );
  }

  function handleCountriesConfirm() {
    if (selectedCountries.length === 0) return;

    const countryLabels = selectedCountries
      .map((c) => COUNTRIES.find((ct) => ct.code === c)?.label ?? c)
      .join(", ");

    setMessages((prev) => [
      ...prev.filter((m) => m.type !== "countries"),
      {
        role: "bot",
        content:
          "Last one \u2014 which countries would you like to market in?",
      },
      { role: "user", content: countryLabels },
      {
        role: "bot",
        content: "Building your brand image",
        type: "loading",
      },
    ]);
    setStep("generating");
    generateBrandImage(answers);
  }

  async function generateBrandImage(
    finalAnswers: { question: string; answer: string }[],
  ) {
    try {
      const res = await fetch("/api/brand-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scrapedData,
          answers: finalAnswers,
          brandUrl,
          targetMarkets: selectedCountries,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStep("done");
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "loading"),
        {
          role: "bot",
          content: `All done! Your brand image for \u201C${data.brand_name}\u201D is ready. Taking you to the dashboard...`,
        },
      ]);
      setTimeout(() => onComplete(), 2000);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "loading"),
        {
          role: "bot",
          content:
            "Something went wrong generating your brand image. Please try again.",
        },
      ]);
      setStep("countries");
    }
  }

  const lastMsg = messages[messages.length - 1];
  const showMCQ = step === "questions" && lastMsg?.type === "mcq";
  const activeMCQ = showMCQ ? lastMsg.mcq : null;
  const showCountries = step === "countries";

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          ReelAtlas
        </span>
        <UserButton />
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-3 px-4 py-8">
          {messages.map((msg, i) => {
            const isLastMcq =
              msg.type === "mcq" && i === messages.length - 1;

            if (msg.type === "countries" && showCountries) {
              return (
                <div key={i} className="animate-msg-in flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-zinc-200/80 px-4 py-2.5 text-sm text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-100">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                className={`animate-msg-in flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                style={{ animationDelay: `${Math.min(i * 50, 200)}ms` }}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm transition-all ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-200/80 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-100"
                  }`}
                >
                  {msg.type === "steps" ? (
                    <StepLoader />
                  ) : msg.type === "loading" ? (
                    <LoadingDots text={msg.content} />
                  ) : msg.type === "mcq" && !isLastMcq ? (
                    msg.mcq?.question
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            );
          })}

          {activeMCQ && (
            <div className="animate-msg-in grid grid-cols-2 gap-2.5 pt-1">
              {activeMCQ.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleOptionSelect(option)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-md active:translate-y-0 active:shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {showCountries && (
            <div className="animate-msg-in space-y-4 pt-1">
              <div className="grid grid-cols-3 gap-2">
                {COUNTRIES.map((country) => {
                  const selected = selectedCountries.includes(country.code);
                  return (
                    <button
                      key={country.code}
                      onClick={() => toggleCountry(country.code)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                        selected
                          ? "border-zinc-900 bg-zinc-900 text-white shadow-md dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-200 bg-white text-zinc-700 shadow-sm hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200 dark:hover:border-zinc-500"
                      }`}
                    >
                      <span className="text-base">{country.flag}</span>
                      <span className="truncate">{country.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleCountriesConfirm}
                disabled={selectedCountries.length === 0}
                className="w-full rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Continue with {selectedCountries.length} market
                {selectedCountries.length !== 1 ? "s" : ""}
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 px-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl">
          {step === "questions" && questions.length > 0 && (
            <div className="flex items-center gap-3 px-1 pt-3">
              <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                {currentQ + 1}/{questions.length}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-zinc-900 transition-all duration-500 ease-out dark:bg-zinc-100"
                  style={{
                    width: `${((currentQ + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="py-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step === "url") handleUrlSubmit();
              }}
              className="relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={step !== "url"}
                placeholder={
                  step === "url"
                    ? "Paste your brand URL..."
                    : step === "questions"
                      ? "Pick an option above to continue"
                      : step === "countries"
                        ? "Select your target markets above"
                        : step === "scraping"
                          ? "Analyzing your brand..."
                          : step === "generating"
                            ? "Generating your brand image..."
                            : "Redirecting to dashboard..."
                }
                autoFocus
                className="w-full rounded-full border border-zinc-200 bg-white py-3.5 pl-5 pr-12 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-800"
              />
              <button
                type="submit"
                disabled={step !== "url" || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-zinc-900 p-2 text-white transition-all hover:bg-zinc-800 disabled:opacity-30 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {step === "scraping" || step === "generating" ? (
                  <CircleNotch size={14} className="animate-spin" />
                ) : (
                  <PaperPlaneRight size={14} weight="bold" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Content ───────────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, updateBrandImage } = useDashboard();
  const tab = searchParams.get("tab") || "home";
  const brandImage = profile?.brandImage?.full_brand_image;

  // Refine state
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [cardRefreshKey, setCardRefreshKey] = useState(0);

  // Scripts state (shared across tabs)
  const [scripts, setScripts] = useState<Script[]>([]);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);



  // Load scripts
  useEffect(() => {
    if (!scriptsLoaded) {
      fetch("/api/scripts")
        .then((res) => res.json())
        .then((data) => {
          setScripts(data.scripts || []);
          setScriptsLoaded(true);
        })
        .catch(() => setScriptsLoaded(true));
    }
  }, [scriptsLoaded]);

  // ─── Brand image refine ───────────────────────────────────────────

  async function handleRefine() {
    if (!refineInput.trim() || !brandImage) return;
    setRefining(true);

    const toastId = toast.loading("Refining your brand image...", {
      icon: <CircleNotch size={16} className="animate-spin" />,
    });

    try {
      const res = await fetch("/api/brand-image/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: refineInput,
          currentBrandImage: brandImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      updateBrandImage(data);
      setRefineInput("");
      setCardRefreshKey((k) => k + 1);

      toast.success("Brand image updated successfully", {
        id: toastId,
        icon: <CheckCircle size={16} weight="fill" className="text-green-500" />,
      });
    } catch {
      toast.error("Failed to refine brand image. Please try again.", { id: toastId });
    } finally {
      setRefining(false);
    }
  }

  // ─── Computed state ───────────────────────────────────────────────


  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-hidden">
      {/* ──── HOME TAB: Script cards or script detail ──── */}
      {tab === "home" && (
        <div className="h-full overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Scripts
                </h1>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {scripts.length} script{scripts.length !== 1 ? "s" : ""} created
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/studio")}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Sparkle size={12} weight="fill" />
                Create script
              </button>
            </div>

            {!scriptsLoaded ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                      <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                      <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                    <div className="mt-5 h-3 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                ))}
              </div>
            ) : scripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <FilmSlate size={40} className="text-zinc-200 dark:text-zinc-800" />
                <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">No scripts yet</p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">Head to the Studio to generate your first scripts</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {scripts.map((script) => {
                  const formatMatch = script.content.match(/\*Format:\s*([^|*]+)/);
                  const durationMatch = script.content.match(/Duration:\s*([^|*]+)/);
                  const dateStr = new Date(script.updated_at || script.created_at).toLocaleDateString("en-US", {
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
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                          {script.title}
                        </h3>
                        {script.ready_to_localize && (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Localized
                          </span>
                        )}
                      </div>

                      {/* Tags row */}
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

                      {/* Localized markets */}
                      {script.localized_markets && script.localized_markets.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-2">
                          <div className="flex items-center -space-x-1">
                            {script.localized_markets.slice(0, 5).map((code) => {
                              const country = COUNTRIES.find((c) => c.code === code);
                              return country ? (
                                <div
                                  key={code}
                                  title={country.label}
                                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-zinc-100 dark:border-zinc-900 dark:bg-zinc-800"
                                >
                                  <ReactCountryFlag
                                    countryCode={country.countryCode}
                                    svg
                                    style={{ width: 12, height: 12 }}
                                    className="rounded-sm object-cover"
                                  />
                                </div>
                              ) : null;
                            })}
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

                      <div className="mt-auto pt-4">
                        <button
                          onClick={() => router.push(`/dashboard/script/${script.id}`)}
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
      )}

      {/* ──── BRAND TAB ──── */}
      {tab === "brand" && (
        <div className="h-full overflow-y-auto">
          <div className="mx-auto max-w-5xl px-8 py-8">
            {brandImage ? (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleRefine(); }}
                  className="relative"
                >
                  <input
                    type="text"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    disabled={refining}
                    placeholder="Tell AI how to refine your brand image..."
                    className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-4 pr-28 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                  />
                  <button
                    type="submit"
                    disabled={refining || !refineInput.trim()}
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {refining ? <CircleNotch size={12} className="animate-spin" /> : <Sparkle size={12} weight="fill" />}
                    Refine
                  </button>
                </form>
                <BrandImageEditor markdown={brandImageToMarkdown(brandImage)} refreshKey={cardRefreshKey} />
              </div>
            ) : (
              <div className="animate-msg-in rounded-xl border border-zinc-200 bg-white p-8 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                No brand image data found.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function brandImageToMarkdown(b: BrandImage): string {
  const lines: string[] = [];

  lines.push(`# ${b.brand_name}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  lines.push("## Brand Voice");
  lines.push(b.brand_voice);
  lines.push("");

  lines.push("## Target Audience");
  lines.push(b.target_audience);
  lines.push("");

  lines.push("## Content Style");
  lines.push(b.content_style);
  lines.push("");

  lines.push("## Content Themes");
  for (const theme of b.content_themes) {
    lines.push(`- ${theme}`);
  }
  lines.push("");

  lines.push("## Cultural Notes");
  for (const [market, note] of Object.entries(b.cultural_notes)) {
    lines.push(`### ${market}`);
    lines.push(note);
    lines.push("");
  }

  lines.push("## UGC Suggestions");
  b.ugc_suggestions.forEach((s, i) => {
    lines.push(`${i + 1}. ${s}`);
  });

  return lines.join("\n");
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, loading, refetchProfile } = useDashboard();

  if (loading) return null; // layout shows spinner

  if (!profile?.onboarding_complete) {
    return <OnboardingChat onComplete={refetchProfile} />;
  }

  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
