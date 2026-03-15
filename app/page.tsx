"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  FileText,
  Zap,
  Monitor,
  Quote,
  ArrowRight,
} from "lucide-react";

const CobeGlobe = dynamic(() => import("./components/Globe"), { ssr: false });

const featuredMarkets = [
  { code: "US", label: "USA", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "JP", label: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "BR", label: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "DE", label: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "FR", label: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "KR", label: "Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "IN", label: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "MX", label: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "ID", label: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "TR", label: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
];

const steps = [
  {
    num: "01",
    icon: Monitor,
    title: "Intelligence Scrape",
    desc: "Our agent crawls your site to map your tone, values, and cultural flexibility thresholds.",
  },
  {
    num: "02",
    icon: FileText,
    title: "Adaptive Narrative",
    desc: "Generate script variations that preserve your core message while shifting the emotional hook per market.",
  },
  {
    num: "03",
    icon: Zap,
    title: "Cultural Injection",
    desc: "Content is reconstructed with local slang, ritual context, and visual moodboards for every locale.",
  },
];

const comparisonRows = [
  {
    market: "United States",
    flag: "\u{1F1FA}\u{1F1F8}",
    code: "US",
    adaptation: '"Feel confident in your skin every day"',
    backTranslation: null,
    strategy: "Direct Empowerment",
  },
  {
    market: "Japan",
    flag: "\u{1F1EF}\u{1F1F5}",
    code: "JP",
    adaptation: "\u808C\u304C\u672C\u6765\u6301\u3064\u7F8E\u3057\u3055\u3092\u3001\u6BCE\u65E5\u306E\u5100\u5F0F\u3067\u5F15\u304D\u51FA\u3059",
    backTranslation: '"Draw out the beauty your skin naturally holds, through daily ritual"',
    strategy: "Ritual & Tradition",
  },
  {
    market: "Brazil",
    flag: "\u{1F1E7}\u{1F1F7}",
    code: "BR",
    adaptation: "Brilhe do jeito que voc\u00EA \u00E9, todo dia",
    backTranslation: '"Shine the way you are, every single day"',
    strategy: "Self-Expression",
  },
  {
    market: "South Korea",
    flag: "\u{1F1F0}\u{1F1F7}",
    code: "KR",
    adaptation: "\uD53C\uBD80 \uBCF8\uC5F0\uC758 \uBE5B\uC744 \uAE68\uC6B0\uB294 \uC544\uCE68\uC758 \uAC10\uAC01",
    backTranslation: '"Waking up the morning senses that awaken the skin\u2019s natural light"',
    strategy: "Sensory Light",
  },
];

function smoothScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  e.preventDefault();
  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-white selection:text-black overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 backdrop-blur-xl bg-black/60 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.ico" alt="ReelAtlas" className="w-8 h-8" />
          <span style={{ fontFamily: "serif" }} className="text-xl font-medium tracking-tight text-white">
            Reel<span className="text-zinc-500 italic">Atlas</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {["How it works", "Showcase"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
              onClick={(e) => smoothScroll(e, `#${item.toLowerCase().replace(/\s/g, "-")}`)}
              className="text-[13px] text-zinc-500 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="text-[13px] bg-white text-black px-5 py-2 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
        >
          Go to Dashboard
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-44 pb-28 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[15%] left-[15%] w-[35%] h-[35%] bg-indigo-600/8 rounded-full blur-[120px]" />
          <div className="absolute top-[25%] right-[15%] w-[35%] h-[35%] bg-purple-600/8 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-normal tracking-tighter leading-[0.95] mb-8 text-white"
            style={{ fontFamily: "serif" }}
          >
            Your brand speaks.
            <br />
            <span className="italic text-zinc-500">The world understands.</span>
          </h1>

          <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-12 font-light leading-relaxed">
            Paste your URL. ReelAtlas reads your brand, understands your voice, and rebuilds your UGC content for every market — culturally reimagined, not translated.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2.5 bg-white text-black px-8 py-3.5 rounded-xl text-[15px] font-medium hover:bg-zinc-200 transition-colors"
            >
              Start for free <ArrowRight size={16} />
            </Link>
            <a
              href="#how-it-works"
              onClick={(e) => smoothScroll(e, "#how-it-works")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[15px] text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white transition-all"
            >
              See how it works
            </a>
          </div>

          {/* Market pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-16 max-w-2xl mx-auto">
            {featuredMarkets.map((m) => (
              <span
                key={m.code}
                className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5"
              >
                <span className="text-sm">{m.flag}</span>
                {m.label}
                <span className="text-[10px] text-zinc-600">{m.code}</span>
              </span>
            ))}
            <span className="inline-flex items-center text-[12px] text-zinc-600 px-3 py-1.5 rounded-full border border-dashed border-white/10">
              + 50 more
            </span>
          </div>
        </div>
      </section>

      {/* Globe */}
      <section className="max-w-3xl mx-auto px-6 -mt-10 mb-10">
        <CobeGlobe />
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600 mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-normal text-white" style={{ fontFamily: "serif" }}>
            Three steps to a <span className="italic text-zinc-500">global campaign</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="group relative p-8 rounded-2xl bg-zinc-900/40 border border-white/5 transition-all duration-300 hover:bg-zinc-900/70 hover:border-white/10"
              >
                <div className="mb-6 w-11 h-11 rounded-xl bg-zinc-800/80 border border-white/5 flex items-center justify-center text-zinc-400 transition-all duration-300 group-hover:bg-white group-hover:text-black group-hover:border-transparent group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className="text-[10px] font-medium tracking-[0.15em] text-zinc-600 uppercase mb-2">
                  Step {step.num}
                </div>
                <h3 className="text-lg font-medium text-white mb-3 transition-colors duration-300 group-hover:text-white">
                  {step.title}
                </h3>
                <p className="text-[13.5px] text-zinc-500 leading-relaxed font-light">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Back-translation showcase */}
      <section id="showcase" className="max-w-5xl mx-auto px-6 py-24">
        <div className="mb-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-600 mb-3">Back-translation proof</p>
          <h2 className="text-3xl md:text-4xl font-normal text-white mb-4" style={{ fontFamily: "serif" }}>
            See how your message <span className="italic text-zinc-500">actually lands</span>
          </h2>
          <p className="text-zinc-500 max-w-lg text-[15px] font-light leading-relaxed">
            Every adaptation is translated back to English so you always know what your audience reads.
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 overflow-hidden bg-zinc-900/20">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-12 bg-zinc-900/60 border-b border-white/5">
            <div className="col-span-3 px-6 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600">
              Market
            </div>
            <div className="col-span-5 px-6 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 border-l border-white/5">
              Adaptation
            </div>
            <div className="col-span-4 px-6 py-4 text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-600 border-l border-white/5">
              Back-translation
            </div>
          </div>

          {comparisonRows.map((row) => (
            <div
              key={row.code}
              className="grid grid-cols-1 sm:grid-cols-12 border-b last:border-0 border-white/5 hover:bg-white/[0.015] transition-colors"
            >
              <div className="col-span-3 px-6 py-6 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{row.flag}</span>
                  <span className="text-[15px] font-medium text-white">{row.market}</span>
                </div>
                <span className="inline-flex self-start text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-600 px-2 py-0.5 rounded bg-white/[0.04]">
                  {row.strategy}
                </span>
              </div>

              <div className="col-span-5 px-6 py-6 border-l border-white/5 flex items-center">
                <span className="text-[15px] font-light leading-relaxed text-zinc-300">
                  {row.adaptation}
                </span>
              </div>

              <div className="col-span-4 px-6 py-6 border-l border-white/5 flex items-start gap-3">
                {row.backTranslation ? (
                  <>
                    <Quote size={14} className="shrink-0 mt-1 text-zinc-700" />
                    <span className="text-[13px] text-zinc-500 italic font-light leading-relaxed">
                      {row.backTranslation}
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-700 text-[10px] font-medium uppercase tracking-[0.1em]">
                    — Original
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-32 text-center">
        <div className="flex justify-center gap-1.5 mb-8">
          {featuredMarkets.slice(0, 6).map((m) => (
            <span key={m.code} className="text-2xl">{m.flag}</span>
          ))}
        </div>
        <h2
          className="text-4xl md:text-6xl font-normal mb-6 text-white leading-[1.05]"
          style={{ fontFamily: "serif" }}
        >
          Your brand belongs
          <br />
          <span className="text-zinc-500 italic">everywhere.</span>
        </h2>
        <p className="text-zinc-500 mb-10 text-[15px] font-light">
          Start with a URL. Leave with a global campaign.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2.5 bg-white text-black px-8 py-3.5 rounded-xl text-[15px] font-medium hover:bg-zinc-200 transition-colors"
        >
          Get early access <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
