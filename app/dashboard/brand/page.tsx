"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkle, CircleNotch, CheckCircle } from "@phosphor-icons/react";
import BrandImageEditor from "../components/BrandImageEditor";
import { useDashboard } from "../layout";

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

export default function BrandPage() {
  const { profile, updateBrandImage } = useDashboard();
  const brandImage = profile?.brandImage?.full_brand_image;

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

  return (
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
  );
}
