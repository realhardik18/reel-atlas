"use client";

import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

interface ScrapeResult {
  title: string | null;
  description: string | null;
  content: string | null;
  links: string[];
  metadata: Record<string, unknown>;
}

export default function DashboardPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to scrape URL. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 px-8 py-4 dark:border-zinc-800">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          ReelAtlas
        </span>
        <UserButton />
      </header>

      <main className="mx-auto max-w-3xl px-8 py-12">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Brand Onboarding
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Enter a brand URL to scrape and analyze their web presence.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Scraping..." : "Scrape"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-6">
            {result.title && (
              <div>
                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Title
                </h2>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {result.title}
                </p>
              </div>
            )}

            {result.description && (
              <div>
                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Description
                </h2>
                <p className="mt-1 text-zinc-700 dark:text-zinc-300">
                  {result.description}
                </p>
              </div>
            )}

            {result.content && (
              <div>
                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Content
                </h2>
                <div className="mt-1 max-h-96 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700 whitespace-pre-wrap dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  {result.content}
                </div>
              </div>
            )}

            {result.links && result.links.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Links ({result.links.length})
                </h2>
                <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto text-sm">
                  {result.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.metadata &&
              Object.keys(result.metadata).length > 0 && (
                <div>
                  <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Metadata
                  </h2>
                  <pre className="mt-1 max-h-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                    {JSON.stringify(result.metadata, null, 2)}
                  </pre>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
