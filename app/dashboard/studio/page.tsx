"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkle,
  CircleNotch,
  CheckCircle,
  Trash,
  NotePencil,
  FilmSlate,
} from "@phosphor-icons/react";
import ScriptEditor from "../components/ScriptEditor";
import { useDashboard } from "../layout";

interface Script {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  ready_to_localize?: boolean;
}

export default function StudioPage() {
  const router = useRouter();
  const { profile } = useDashboard();
  const brandImage = profile?.brandImage?.full_brand_image;

  // Saved scripts
  const [scripts, setScripts] = useState<Script[]>([]);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/scripts")
      .then((res) => res.json())
      .then((data) => {
        setScripts(data.scripts || []);
        setScriptsLoaded(true);
      })
      .catch(() => setScriptsLoaded(true));
  }, []);

  // Studio generation state
  const [generating, setGenerating] = useState(false);
  const [streamingScripts, setStreamingScripts] = useState<string[]>([]);
  const [streamingDone, setStreamingDone] = useState(false);
  const [scriptCount, setScriptCount] = useState(3);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateNotes, setGenerateNotes] = useState("");
  const [refiningIndex, setRefiningIndex] = useState<number | null>(null);
  const [scriptRefineInputs, setScriptRefineInputs] = useState<Record<number, string>>({});
  const [showRefineInput, setShowRefineInput] = useState<number | null>(null);

  const showStudioColumns = generating || streamingScripts.some((s) => s.length > 0);

  // ─── Script Generation ─────────────────────────────────────────────

  async function handleGenerate(count: number, notes: string) {
    setShowGenerateModal(false);
    setGenerating(true);
    setStreamingDone(false);
    setShowRefineInput(null);
    setStreamingScripts(new Array(count).fill(""));

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const parts = fullText.split("===SCRIPT_BREAK===");
        const newScripts = parts.map((p) => p.trim());
        setStreamingScripts((prev) => {
          const updated = [...prev];
          for (let i = 0; i < Math.min(newScripts.length, count); i++) {
            updated[i] = newScripts[i];
          }
          return updated;
        });
      }

      const finalParts = fullText.split("===SCRIPT_BREAK===").map((p) => p.trim()).filter(Boolean);
      const finalScripts = new Array(count).fill("");
      for (let i = 0; i < Math.min(finalParts.length, count); i++) {
        finalScripts[i] = finalParts[i];
      }
      setStreamingScripts(finalScripts);
      setStreamingDone(true);
    } catch {
      toast.error("Failed to generate scripts. Please try again.");
      setStreamingScripts([]);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRefineScript(index: number) {
    const prompt = scriptRefineInputs[index]?.trim();
    const currentScript = streamingScripts[index];
    if (!prompt || !currentScript) return;

    setRefiningIndex(index);
    setShowRefineInput(null);

    try {
      const res = await fetch("/api/scripts/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: currentScript, prompt }),
      });

      if (!res.ok) throw new Error("Failed to refine");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingScripts((prev) => {
          const updated = [...prev];
          updated[index] = fullText.trim();
          return updated;
        });
      }

      setStreamingScripts((prev) => {
        const updated = [...prev];
        updated[index] = fullText.trim();
        return updated;
      });
      setScriptRefineInputs((prev) => ({ ...prev, [index]: "" }));
      toast.success("Script refined");
    } catch {
      toast.error("Failed to refine script.");
    } finally {
      setRefiningIndex(null);
    }
  }

  function handleDiscardScript(index: number) {
    setStreamingScripts((prev) => prev.filter((_, i) => i !== index));
    setScriptRefineInputs((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    if (showRefineInput === index) setShowRefineInput(null);
  }

  async function handleSaveScript(index: number) {
    const content = streamingScripts[index];
    if (!content) return;
    setSavingIndex(index);

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : `Script ${index + 1}`;

    try {
      const res = await fetch("/api/scripts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error);

      // Add to saved scripts & remove from streaming
      setScripts((prev) => [saved, ...prev]);
      setStreamingScripts((prev) => prev.filter((_, i) => i !== index));
      toast.success(`"${title}" saved`);
    } catch {
      toast.error("Failed to save script.");
    } finally {
      setSavingIndex(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Studio top bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-2.5 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Studio</h2>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {generating ? <CircleNotch size={12} className="animate-spin" /> : <Sparkle size={12} weight="fill" />}
          Generate
        </button>
      </div>

      {/* Generate modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Generate scripts</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Configure your generation and add any specific notes or direction.
            </p>
            <div className="mt-5">
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">Number of scripts</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setScriptCount(n)}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                      scriptCount === n
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Notes & direction <span className="font-normal text-zinc-400 dark:text-zinc-500">(optional)</span>
              </label>
              <textarea
                value={generateNotes}
                onChange={(e) => setGenerateNotes(e.target.value)}
                placeholder="e.g. Focus on a product launch angle, keep it casual and humorous, target Gen Z on TikTok..."
                rows={3}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-800"
              />
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowGenerateModal(false); setGenerateNotes(""); }}
                className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerate(scriptCount, generateNotes)}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Sparkle size={12} weight="fill" />
                Generate {scriptCount} script{scriptCount !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Studio main area */}
      <div className="flex-1 overflow-hidden">
        {showStudioColumns && (
          <div className="flex h-full gap-3 bg-zinc-100 p-3 dark:bg-zinc-900">
            {streamingScripts.map((content, i) => (
              <div
                key={i}
                className="flex h-full flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
              >
                {/* Column header */}
                <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-2 dark:border-zinc-800/50">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate mr-2">
                    {content.match(/^#\s+(.+)$/m)?.[1] || `Script ${i + 1}`}
                  </span>
                  <div className="flex items-center gap-1">
                    {generating && !content && (
                      <CircleNotch size={12} className="animate-spin text-zinc-300 dark:text-zinc-600" />
                    )}
                    {refiningIndex === i && (
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <CircleNotch size={10} className="animate-spin" />
                        <span>Refining...</span>
                      </div>
                    )}
                    {streamingDone && content && refiningIndex !== i && (
                      <>
                        <button
                          onClick={() => setShowRefineInput(showRefineInput === i ? null : i)}
                          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          title="Refine this script"
                        >
                          <Sparkle size={12} weight={showRefineInput === i ? "fill" : "regular"} />
                        </button>
                        <button
                          onClick={() => handleDiscardScript(i)}
                          className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                          title="Discard"
                        >
                          <Trash size={12} />
                        </button>
                        <button
                          onClick={() => handleSaveScript(i)}
                          disabled={savingIndex === i}
                          className="ml-1 flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                          {savingIndex === i ? <CircleNotch size={10} className="animate-spin" /> : <CheckCircle size={10} weight="fill" />}
                          Save
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Refine input bar */}
                {showRefineInput === i && (
                  <div className="shrink-0 border-b border-zinc-100 px-3 py-2 dark:border-zinc-800/50">
                    <form onSubmit={(e) => { e.preventDefault(); handleRefineScript(i); }} className="flex gap-2">
                      <input
                        type="text"
                        value={scriptRefineInputs[i] || ""}
                        onChange={(e) => setScriptRefineInputs((prev) => ({ ...prev, [i]: e.target.value }))}
                        disabled={refiningIndex === i}
                        placeholder="Make it more casual, add a CTA, shorten the intro..."
                        autoFocus
                        className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                      />
                      <button
                        type="submit"
                        disabled={!scriptRefineInputs[i]?.trim() || refiningIndex === i}
                        className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        <Sparkle size={10} weight="fill" />
                        Refine
                      </button>
                    </form>
                  </div>
                )}

                {/* Editor */}
                <div className="flex-1 overflow-y-auto">
                  {content ? (
                    <ScriptEditor
                      key={`stream-${i}-${streamingDone ? "done" : "streaming"}`}
                      initialContent={content}
                      editable={streamingDone && refiningIndex !== i}
                      streaming={!streamingDone || refiningIndex === i}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <CircleNotch size={16} className="mx-auto animate-spin text-zinc-300 dark:text-zinc-700" />
                        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">Generating...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saved scripts */}
        {!showStudioColumns && (
          <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-6xl px-8 py-8">
              <div className="mb-6">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {scripts.length} script{scripts.length !== 1 ? "s" : ""} created
                </p>
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
                      <div className="mt-4 h-7 w-24 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                  ))}
                </div>
              ) : scripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <FilmSlate size={40} className="text-zinc-200 dark:text-zinc-800" />
                  <p className="mt-4 text-sm text-zinc-400 dark:text-zinc-500">No scripts yet</p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                    Click Generate to create your first scripts
                  </p>
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
                              Localize
                            </span>
                          )}
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

                        <div className="mt-4">
                          <button
                            onClick={() => router.push("/dashboard")}
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
      </div>
    </div>
  );
}
