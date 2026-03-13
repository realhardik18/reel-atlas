"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  House,
  ImageSquare,
  GearSix,
  CaretLineLeft,
  CaretLineRight,
  PaperPlaneRight,
  Sparkle,
  CircleNotch,
  CheckCircle,
  Globe,
  FileMagnifyingGlass,
  ChatTeardropDots,
} from "@phosphor-icons/react";

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

type Tab = "home" | "brand";

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
      {/* Fixed header */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          ReelAtlas
        </span>
        <UserButton />
      </header>

      {/* Scrollable messages area */}
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

          {/* MCQ 2x2 grid */}
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

          {/* Country multi-select grid */}
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

      {/* Fixed bottom area */}
      <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 px-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl">
          {/* Question progress bar */}
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

          {/* Input bar — always visible, disabled when not in URL step */}
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

// ─── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({
  profile,
  onBrandUpdate,
}: {
  profile: ProfileData;
  onBrandUpdate: (b: BrandImage) => void;
}) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const brandImage = profile.brandImage?.full_brand_image;

  // Refine state
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [cardRefreshKey, setCardRefreshKey] = useState(0);

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

      onBrandUpdate(data);
      setRefineInput("");
      setCardRefreshKey((k) => k + 1);

      toast.success("Brand image updated successfully", {
        id: toastId,
        icon: (
          <CheckCircle
            size={16}
            weight="fill"
            className="text-green-500"
          />
        ),
      });
    } catch {
      toast.error("Failed to refine brand image. Please try again.", {
        id: toastId,
      });
    } finally {
      setRefining(false);
    }
  }

  const navItems: {
    id: Tab;
    label: string;
    icon: typeof House;
  }[] = [
    { id: "home", label: "Home", icon: House },
    { id: "brand", label: "Brand Image", icon: ImageSquare },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white transition-all duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo + collapse */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              ReelAtlas
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            {collapsed ? (
              <CaretLineRight size={16} />
            ) : (
              <CaretLineLeft size={16} />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  activeTab === item.id
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
            className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
          >
            <UserButton />
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={`rounded-lg p-1.5 transition-all duration-200 ${
                    settingsOpen
                      ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  }`}
                >
                  <GearSix
                    size={16}
                    className={`transition-transform duration-300 ${settingsOpen ? "rotate-90" : ""}`}
                  />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          {/* Settings panel */}
          {settingsOpen && (
            <div className="animate-msg-in mb-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Settings
              </h2>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Settings coming soon.
              </p>
            </div>
          )}

          {activeTab === "home" && (
            <div className="animate-msg-in rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Hello, {user?.firstName || "there"}!
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Welcome to your ReelAtlas dashboard. Your brand image is ready
                \u2014 explore it in the Brand Image tab.
              </p>
            </div>
          )}

          {activeTab === "brand" && brandImage && (
            <div className="space-y-6">
              {/* Header + Refine bar */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {brandImage.brand_name}
                </h1>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRefine();
                  }}
                  className="relative"
                >
                  <input
                    type="text"
                    value={refineInput}
                    onChange={(e) => setRefineInput(e.target.value)}
                    disabled={refining}
                    placeholder="Refine with a prompt..."
                    className="w-72 rounded-full border border-zinc-200 bg-white py-2.5 pl-4 pr-24 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-700"
                  />
                  <button
                    type="submit"
                    disabled={refining || !refineInput.trim()}
                    className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {refining ? (
                      <CircleNotch size={12} className="animate-spin" />
                    ) : (
                      <Sparkle size={12} weight="fill" />
                    )}
                    Refine
                  </button>
                </form>
              </div>

              <div
                key={cardRefreshKey}
                className={`space-y-6 ${cardRefreshKey > 0 ? "animate-card-refresh" : ""}`}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <Card title="Brand Voice" delay={0}>
                    {brandImage.brand_voice}
                  </Card>
                  <Card title="Target Audience" delay={1}>
                    {brandImage.target_audience}
                  </Card>
                  <Card title="Content Style" delay={2}>
                    {brandImage.content_style}
                  </Card>
                  <Card title="Content Themes" delay={3}>
                    <ul className="list-inside list-disc space-y-1">
                      {brandImage.content_themes.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </Card>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                  {Object.entries(brandImage.cultural_notes).map(
                    ([market, note], idx) => (
                      <Card
                        key={market}
                        title={`${market} Market`}
                        delay={4 + idx}
                      >
                        {note}
                      </Card>
                    ),
                  )}
                </div>

                <Card title="UGC Suggestions" delay={8}>
                  <ul className="list-inside list-decimal space-y-2">
                    {brandImage.ugc_suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "brand" && !brandImage && (
            <div className="animate-msg-in rounded-xl border border-zinc-200 bg-white p-8 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No brand image data found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Card({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="animate-msg-in rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      style={{ animationDelay: `${delay * 60}ms` }}
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        {children}
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile() {
    const res = await fetch("/api/profile");
    const data = await res.json();
    setProfile(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  function handleBrandUpdate(updated: BrandImage) {
    if (!profile?.brandImage) return;
    setProfile({
      ...profile,
      brandImage: {
        ...profile.brandImage,
        full_brand_image: updated,
      },
    });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <CircleNotch size={24} className="animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!profile?.onboarding_complete) {
    return (
      <OnboardingChat
        onComplete={() => {
          setLoading(true);
          fetchProfile();
        }}
      />
    );
  }

  return <Dashboard profile={profile} onBrandUpdate={handleBrandUpdate} />;
}
