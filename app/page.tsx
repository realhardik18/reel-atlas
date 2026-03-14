import Link from "next/link";
import { ShaderBackground } from "./components/ShaderBackground";

const markets = [
  { code: "US", label: "United States", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "JP", label: "Japan", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "BR", label: "Brazil", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "DE", label: "Germany", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "IN", label: "India", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "KR", label: "South Korea", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "MX", label: "Mexico", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "FR", label: "France", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "ID", label: "Indonesia", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "TR", label: "Turkey", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "VN", label: "Vietnam", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "AU", label: "Australia", flag: "\u{1F1E6}\u{1F1FA}" },
];

const steps = [
  {
    num: "01",
    label: "Brand",
    title: "Paste your URL",
    desc: "We scrape your site, ask 5 smart questions, and build a full brand intelligence profile with a cultural flexibility score.",
  },
  {
    num: "02",
    label: "Create",
    title: "Generate your campaign",
    desc: "Multiple script variations, hooks, captions, and titles. Iterate in a live editor. Finalize when it feels right.",
  },
  {
    num: "03",
    label: "Localize",
    title: "Go global instantly",
    desc: "Your campaign is culturally rebuilt for each market with back-translation proof, cultural citations, and a moodboard per locale.",
  },
];

const comparisonRows = [
  {
    market: "Original",
    flag: "\u{1F1FA}\u{1F1F8}",
    code: "US",
    adaptation: '"Feel confident in your skin every day"',
    backTranslation: null,
    isOriginal: true,
  },
  {
    market: "Japan",
    flag: "\u{1F1EF}\u{1F1F5}",
    code: "JP",
    adaptation: "\u808C\u304C\u672C\u6765\u6301\u3064\u7F8E\u3057\u3055\u3092\u3001\u6BCE\u65E5\u306E\u5100\u5F0F\u3067\u5F15\u304D\u51FA\u3059",
    backTranslation:
      '"Draw out the beauty your skin naturally holds, through daily ritual"',
    isOriginal: false,
  },
  {
    market: "Brazil",
    flag: "\u{1F1E7}\u{1F1F7}",
    code: "BR",
    adaptation: "Brilhe do jeito que voc\u00EA \u00E9, todo dia",
    backTranslation: '"Shine the way you are, every single day"',
    isOriginal: false,
  },
  {
    market: "Germany",
    flag: "\u{1F1E9}\u{1F1EA}",
    code: "DE",
    adaptation: "Klinisch pr\u00E4zise. Sichtbar wirksam.",
    backTranslation: '"Clinically precise. Visibly effective."',
    isOriginal: false,
  },
];

const features = [
  {
    title: "Brand intelligence engine",
    desc: "Scrapes your site and asks smart, brand-specific questions to build a complete profile — not a generic template.",
  },
  {
    title: "Campaign studio with version history",
    desc: "Generate, discard, rewrite, and iterate. Every version saved. Go back any time.",
  },
  {
    title: "Cultural reconstruction, not translation",
    desc: "Each market gets content built around what actually resonates there — emotionally, linguistically, culturally.",
  },
  {
    title: "Back-translation proof",
    desc: "See your localized content translated back to English so you always know exactly what your audience will read.",
  },
  {
    title: "Cultural citation for every adaptation",
    desc: "Every change is explained. Understand why your Japan copy leads with ritual and your Brazil copy leads with joy.",
  },
  {
    title: "Campaign pack ZIP download",
    desc: "Hooks, scripts, captions, titles, moodboards — one ZIP per market. Ready to hand to any creator, anywhere.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <ShaderBackground />

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        <div className="text-xl tracking-tight" style={{ fontFamily: "var(--font-instrument-serif), serif", letterSpacing: "-0.3px" }}>
          Reel<span className="italic" style={{ color: "var(--color-text-secondary)" }}>Atlas</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#how-it-works" className="text-[13px]" style={{ color: "var(--color-text-secondary)" }}>
            How it works
          </Link>
          <Link
            href="/sign-up"
            className="text-[13px] px-[18px] py-2 rounded-[var(--border-radius-md)] border-none cursor-pointer"
            style={{ background: "var(--color-text-primary)", color: "var(--color-background-primary)" }}
          >
            Get early access
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-8 max-w-[760px] mx-auto text-center">
        <div
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] mb-8 px-3.5 py-1.5 rounded-full"
          style={{
            color: "var(--color-text-secondary)",
            border: "0.5px solid var(--color-border-secondary)",
          }}
        >
          <span className="text-sm">🌍</span>
          Built for global brands
        </div>

        <h1
          className="text-[clamp(38px,6.5vw,62px)] leading-[1.08] font-normal mb-6"
          style={{ fontFamily: "var(--font-instrument-serif), serif", letterSpacing: "-1.5px" }}
        >
          Your brand speaks.
          <br />
          <em style={{ color: "var(--color-text-secondary)" }}>The world understands.</em>
        </h1>

        <p
          className="text-[17px] leading-[1.75] max-w-[520px] mx-auto mb-12 font-light"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Paste your website URL. ReelAtlas reads your brand, understands your voice, and rebuilds your UGC content for every market — not translated, but culturally reimagined.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 border-none px-8 py-3.5 rounded-[var(--border-radius-md)] text-[15px] cursor-pointer transition-opacity hover:opacity-90"
            style={{ background: "var(--color-text-primary)", color: "var(--color-background-primary)" }}
          >
            Start for free &rarr;
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--border-radius-md)] text-[15px] cursor-pointer transition-opacity hover:opacity-80"
            style={{
              color: "var(--color-text-primary)",
              border: "0.5px solid var(--color-border-secondary)",
            }}
          >
            See it in action
          </Link>
        </div>

        {/* Markets pill cloud */}
        <div className="flex justify-center gap-2 mt-14 flex-wrap max-w-[600px] mx-auto">
          {markets.map((m) => (
            <span
              key={m.code}
              className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full"
              style={{
                color: "var(--color-text-secondary)",
                border: "0.5px solid var(--color-border-tertiary)",
                background: "var(--color-background-secondary)",
              }}
            >
              <span className="text-sm">{m.flag}</span>
              {m.label}
              <span className="text-[10px] font-medium opacity-50">{m.code}</span>
            </span>
          ))}
          <span
            className="inline-flex items-center text-[12px] px-3 py-1.5 rounded-full"
            style={{
              color: "var(--color-text-secondary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderStyle: "dashed",
            }}
          >
            + 50 more
          </span>
        </div>
      </section>

      <div className="mx-8" style={{ height: "0.5px", background: "var(--color-border-tertiary)" }} />

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-8 max-w-[900px] mx-auto">
        <p className="text-[11px] uppercase tracking-[0.08em] mb-4" style={{ color: "var(--color-text-secondary)" }}>
          How it works
        </p>
        <h2
          className="text-[clamp(28px,4vw,42px)] font-normal mb-14 leading-[1.15]"
          style={{ fontFamily: "var(--font-instrument-serif), serif", letterSpacing: "-0.5px" }}
        >
          Three steps to a
          <br />
          <em style={{ color: "var(--color-text-secondary)" }}>global campaign pack</em>
        </h2>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 overflow-hidden"
          style={{
            gap: "1px",
            background: "var(--color-border-tertiary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
          }}
        >
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-7 sm:p-8"
              style={{ background: "var(--color-background-primary)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-medium"
                  style={{
                    background: "var(--color-background-secondary)",
                    color: "var(--color-text-secondary)",
                    border: "0.5px solid var(--color-border-tertiary)",
                  }}
                >
                  {step.num}
                </span>
                <span className="text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--color-text-secondary)" }}>
                  {step.label}
                </span>
              </div>
              <div className="text-[15px] font-medium mb-2.5">{step.title}</div>
              <div className="text-[13px] leading-[1.65] font-light" style={{ color: "var(--color-text-secondary)" }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-8" style={{ height: "0.5px", background: "var(--color-border-tertiary)" }} />

      {/* Back-translation proof */}
      <section className="py-24 px-8 max-w-[900px] mx-auto">
        <p className="text-[11px] uppercase tracking-[0.08em] mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Back-translation proof
        </p>
        <h2
          className="text-[clamp(28px,4vw,42px)] font-normal mb-4 leading-[1.15]"
          style={{ fontFamily: "var(--font-instrument-serif), serif", letterSpacing: "-0.5px" }}
        >
          See how your message
          <br />
          <em style={{ color: "var(--color-text-secondary)" }}>actually lands</em>
        </h2>
        <p className="text-[15px] mb-10 font-light leading-[1.7]" style={{ color: "var(--color-text-secondary)" }}>
          We translate your adaptation back to English so you know exactly how it reads — without speaking the language.
        </p>

        <div
          className="overflow-hidden"
          style={{
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
          }}
        >
          {/* Header */}
          <div
            className="hidden sm:grid grid-cols-[180px_1fr_1fr]"
            style={{
              background: "var(--color-background-secondary)",
              borderBottom: "0.5px solid var(--color-border-tertiary)",
            }}
          >
            {["Market", "Cultural adaptation", "Back to English"].map((col, i) => (
              <div
                key={col}
                className="px-5 py-3.5 text-[11px] font-medium uppercase tracking-[0.06em]"
                style={{
                  color: "var(--color-text-secondary)",
                  borderRight: i < 2 ? "0.5px solid var(--color-border-tertiary)" : "none",
                }}
              >
                {col}
              </div>
            ))}
          </div>
          {/* Rows */}
          {comparisonRows.map((row, idx) => (
            <div
              key={row.code}
              className="grid grid-cols-1 sm:grid-cols-[180px_1fr_1fr]"
              style={{
                borderBottom: idx < comparisonRows.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none",
                background: "var(--color-background-primary)",
              }}
            >
              <div
                className="px-5 py-4 text-[13px] leading-[1.6] font-medium flex items-center gap-2.5"
                style={{ borderRight: "0.5px solid var(--color-border-tertiary)" }}
              >
                <span className="text-base">{row.flag}</span>
                <span>{row.market}</span>
                <span className="text-[10px] font-normal opacity-40">{row.code}</span>
              </div>
              <div
                className="px-5 py-4 text-[13px] leading-[1.6]"
                style={{
                  borderRight: "0.5px solid var(--color-border-tertiary)",
                  color: row.isOriginal ? "var(--color-text-secondary)" : "var(--color-text-primary)",
                  fontStyle: row.isOriginal ? "italic" : "normal",
                }}
              >
                {row.adaptation}
              </div>
              <div
                className="px-5 py-4 text-[12.5px] leading-[1.6] italic"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {row.backTranslation ?? "\u2014"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-8" style={{ height: "0.5px", background: "var(--color-border-tertiary)" }} />

      {/* Features */}
      <section className="py-24 px-8 max-w-[900px] mx-auto">
        <p className="text-[11px] uppercase tracking-[0.08em] mb-4" style={{ color: "var(--color-text-secondary)" }}>
          What&apos;s inside
        </p>
        <h2
          className="text-[clamp(28px,4vw,42px)] font-normal mb-14 leading-[1.15]"
          style={{ fontFamily: "var(--font-instrument-serif), serif", letterSpacing: "-0.5px" }}
        >
          Everything a global brand
          <br />
          <em style={{ color: "var(--color-text-secondary)" }}>actually needs</em>
        </h2>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 overflow-hidden"
          style={{
            gap: "1px",
            background: "var(--color-border-tertiary)",
            border: "0.5px solid var(--color-border-tertiary)",
            borderRadius: "var(--border-radius-lg)",
          }}
        >
          {features.map((feat) => (
            <div
              key={feat.title}
              className="p-7"
              style={{ background: "var(--color-background-primary)" }}
            >
              <div className="text-[14px] font-medium mb-1.5">{feat.title}</div>
              <div className="text-[13px] leading-[1.65] font-light" style={{ color: "var(--color-text-secondary)" }}>
                {feat.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 px-8 text-center" style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
        <div className="flex justify-center gap-1 mb-6">
          {markets.slice(0, 6).map((m) => (
            <span key={m.code} className="text-xl">{m.flag}</span>
          ))}
        </div>
        <h2
          className="text-[clamp(28px,4vw,46px)] font-normal mb-5 leading-[1.1]"
          style={{ fontFamily: "var(--font-instrument-serif), serif", letterSpacing: "-0.5px" }}
        >
          Your brand belongs
          <br />
          everywhere on earth.
        </h2>
        <p className="text-[15px] mb-10 font-light" style={{ color: "var(--color-text-secondary)" }}>
          Start with a URL. Leave with a global campaign.
        </p>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 border-none px-8 py-3.5 rounded-[var(--border-radius-md)] text-[15px] cursor-pointer transition-opacity hover:opacity-90"
          style={{ background: "var(--color-text-primary)", color: "var(--color-background-primary)" }}
        >
          Get early access &rarr;
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="px-8 py-6 flex justify-between items-center text-xs"
        style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          color: "var(--color-text-secondary)",
        }}
      >
        <span>ReelAtlas — built at Multilingual Hackathon #3</span>
        <span>Powered by Lingo.dev</span>
      </footer>
    </div>
  );
}
