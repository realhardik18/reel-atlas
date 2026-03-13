"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "bot" | "user";
  content: string;
  type?: "text" | "loading";
}

interface BrandImage {
  brand_name: string;
  brand_voice: string;
  target_audience: string;
  content_style: string;
  content_themes: string[];
  cultural_notes: { US: string; UK: string; AU: string; IN: string };
  ugc_suggestions: string[];
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

type Tab = "home" | "brand" | "settings";

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
    "url" | "questions" | "generating" | "done"
  >("url");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<
    { question: string; answer: string }[]
  >([]);
  const [scrapedData, setScrapedData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [brandUrl, setBrandUrl] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function addMessages(...msgs: ChatMessage[]) {
    setMessages((prev) => [...prev, ...msgs]);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    if (step === "url") {
      setBrandUrl(text);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "bot", content: `Analyzing ${text}...`, type: "loading" },
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
          ...prev.filter((m) => m.type !== "loading"),
          {
            role: "bot",
            content:
              "Got it! I've analyzed the site. Let me ask you a few questions to personalize your brand image.",
          },
          { role: "bot", content: data.questions[0] },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev.filter((m) => m.type !== "loading"),
          {
            role: "bot",
            content:
              "Something went wrong analyzing that URL. Please try again.",
          },
        ]);
      }
      return;
    }

    if (step === "questions") {
      addMessages({ role: "user", content: text });
      const newAnswers = [
        ...answers,
        { question: questions[currentQ], answer: text },
      ];
      setAnswers(newAnswers);

      if (currentQ + 1 < questions.length) {
        setCurrentQ(currentQ + 1);
        // Small delay so user message renders first
        setTimeout(() => {
          addMessages({ role: "bot", content: questions[currentQ + 1] });
        }, 300);
      } else {
        // All questions answered — generate brand image
        setStep("generating");
        setTimeout(() => {
          addMessages({
            role: "bot",
            content: "Building your brand image... This may take a moment.",
            type: "loading",
          });
        }, 300);

        try {
          const res = await fetch("/api/brand-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scrapedData,
              answers: newAnswers,
              brandUrl,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          setStep("done");
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== "loading"),
            {
              role: "bot",
              content: `All done! Your brand image for "${data.brand_name}" is ready. Redirecting you to the dashboard...`,
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
          setStep("questions");
          setCurrentQ(questions.length - 1);
        }
      }
    }
  }

  const isDisabled = step === "generating" || step === "done";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          ReelAtlas
        </span>
        <UserButton />
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                } ${msg.type === "loading" ? "animate-pulse" : ""}`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isDisabled}
            placeholder={
              step === "url"
                ? "Paste your brand URL..."
                : step === "questions"
                  ? "Type your answer..."
                  : "Please wait..."
            }
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={isDisabled || !input.trim()}
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({ profile }: { profile: ProfileData }) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const brandImage = profile.brandImage?.full_brand_image;

  const tabs: { id: Tab; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "brand", label: "Brand Image" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            ReelAtlas
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <UserButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-8 py-8">
        {activeTab === "home" && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Hello, {user?.firstName || "there"}!
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Welcome to your ReelAtlas dashboard. Your brand image is ready —
              explore it in the Brand Image tab.
            </p>
          </div>
        )}

        {activeTab === "brand" && brandImage && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {brandImage.brand_name}
            </h1>

            <div className="grid gap-6 md:grid-cols-2">
              <Card title="Brand Voice">{brandImage.brand_voice}</Card>
              <Card title="Target Audience">
                {brandImage.target_audience}
              </Card>
              <Card title="Content Style">{brandImage.content_style}</Card>
              <Card title="Content Themes">
                <ul className="list-inside list-disc space-y-1">
                  {brandImage.content_themes.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {(
                Object.entries(brandImage.cultural_notes) as [
                  string,
                  string,
                ][]
              ).map(([market, note]) => (
                <Card key={market} title={`${market} Market Notes`}>
                  {note}
                </Card>
              ))}
            </div>

            <Card title="UGC Suggestions">
              <ul className="list-inside list-decimal space-y-2">
                {brandImage.ugc_suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {activeTab === "brand" && !brandImage && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No brand image data found.
          </div>
        )}

        {activeTab === "settings" && (
          <div className="rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Settings
            </h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Settings coming soon.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-pulse text-zinc-500">Loading...</div>
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

  return <Dashboard profile={profile} />;
}
