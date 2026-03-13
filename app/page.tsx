import Link from "next/link";

const markets = [
  { flag: "US", label: "United States" },
  { flag: "UK", label: "United Kingdom" },
  { flag: "AU", label: "Australia" },
  { flag: "IN", label: "India" },
];

const steps = [
  {
    number: "1",
    title: "Paste your brand URL",
    description: "Drop any brand website and ReelAtlas scrapes everything — messaging, tone, visuals, positioning.",
  },
  {
    number: "2",
    title: "We understand your voice",
    description: "Our engine breaks down your brand DNA — what you say, how you say it, and who you say it to.",
  },
  {
    number: "3",
    title: "Get market-ready content",
    description: "Receive culturally-adapted hooks, scripts, captions, and video briefs for all 4 markets — rebuilt, not translated.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-6">
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          ReelAtlas
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center px-8">
        <section className="mx-auto flex max-w-3xl flex-col items-center pt-24 pb-20 text-center">
          <div className="mb-6 flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            <span>4 cultural markets</span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span>1 brand URL</span>
          </div>

          <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            One URL. Four markets.
            <br />
            <span className="text-zinc-400 dark:text-zinc-500">Content that actually converts.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Paste a brand link and ReelAtlas scrapes your brand, understands your
            voice, and generates culturally-adapted hooks, scripts, captions, and
            videos — not translated, but rebuilt for how each market thinks,
            feels, and buys.
          </p>

          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start for free
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-lg px-6 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              How it works
            </Link>
          </div>

          {/* Market pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            {markets.map((m) => (
              <span
                key={m.flag}
                className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
              >
                {m.flag} · {m.label}
              </span>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto w-full max-w-4xl py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            How it works
          </h2>
          <p className="mt-3 text-center text-zinc-600 dark:text-zinc-400">
            From URL to UGC content pack in minutes.
          </p>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What you get */}
        <section className="mx-auto w-full max-w-4xl border-t border-zinc-100 py-20 dark:border-zinc-900">
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            What you get
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[
              { title: "Hooks & openers", desc: "Scroll-stopping hooks adapted per market — not generic, not translated." },
              { title: "Full video scripts", desc: "Ready-to-shoot UGC scripts with cultural context baked in." },
              { title: "Captions & copy", desc: "Platform-native captions for TikTok, Reels, and Shorts in each market." },
              { title: "Brand voice analysis", desc: "A breakdown of your brand tone, positioning, and messaging patterns." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"
              >
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-3xl py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Ready to go global?
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Paste your first brand URL and see ReelAtlas in action.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-lg bg-zinc-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Get started free
          </Link>
        </section>
      </main>

      <footer className="border-t border-zinc-100 px-8 py-6 text-center text-sm text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        &copy; {new Date().getFullYear()} ReelAtlas. All rights reserved.
      </footer>
    </div>
  );
}
