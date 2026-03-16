"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CircleNotch,
  ArrowLeft,
  Trash,
  ClockCounterClockwise,
  GlobeHemisphereWest,
  ArrowCounterClockwise,
  FileMagnifyingGlass,
  Sparkle,
  X,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import ScriptEditor from "../../components/ScriptEditor";
import { useDashboard } from "../../layout";

interface Script {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  ready_to_localize?: boolean;
  localized_markets?: string[];
}

interface ScriptVersion {
  id: string;
  version_number: number;
  content: string;
  created_at: string;
}

export default function ScriptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useDashboard();

  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [diffModalVersion, setDiffModalVersion] = useState<ScriptVersion | null>(null);

  // Refine state
  const [showRefine, setShowRefine] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [refining, setRefining] = useState(false);
  const refineInputRef = useRef<HTMLInputElement>(null);

  // Fetch script on mount
  useEffect(() => {
    if (!id) return;
    fetch(`/api/scripts/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setScript(data))
      .catch(() => {
        toast.error("Script not found");
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleScriptUpdate(markdown: string) {
    if (!script) return;
    try {
      const res = await fetch(`/api/scripts/${script.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: markdown }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);
      setScript((prev) =>
        prev ? { ...prev, content: markdown, updated_at: updated.updated_at } : prev,
      );
    } catch {
      // Silent fail for auto-save
    }
  }

  async function handleDeleteScript() {
    if (!script) return;
    try {
      const res = await fetch(`/api/scripts/${script.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Script deleted.");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete script.");
    }
  }

  async function handleToggleLocalize() {
    if (!script) return;
    const current = !!script.ready_to_localize;
    try {
      const res = await fetch(`/api/scripts/${script.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ready_to_localize: !current }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);
      setScript((prev) => (prev ? { ...prev, ready_to_localize: !current } : prev));
      toast.success(!current ? "Marked ready for localization" : "Removed from localization");
    } catch {
      toast.error("Failed to update script.");
    }
  }

  async function loadVersions() {
    if (!script) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/scripts/${script.id}/versions`);
      const data = await res.json();
      setVersions(data.versions || []);
    } catch {
      toast.error("Failed to load versions.");
    } finally {
      setLoadingVersions(false);
    }
  }

  async function handleRevert(versionId: string) {
    if (!script) return;
    setRevertingId(versionId);
    try {
      const res = await fetch(`/api/scripts/${script.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_id: versionId }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error);
      setScript(updated);
      await loadVersions();
      toast.success("Reverted to previous version");
    } catch {
      toast.error("Failed to revert.");
    } finally {
      setRevertingId(null);
    }
  }

  async function handleRefine() {
    if (!script || !refinePrompt.trim()) return;
    setRefining(true);
    const toastId = toast.loading("Refining script...");

    try {
      const res = await fetch("/api/scripts/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: script.content, prompt: refinePrompt }),
      });

      if (!res.ok) throw new Error("Failed to refine");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let refined = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        refined += decoder.decode(value, { stream: true });
      }

      // Save the refined content
      const saveRes = await fetch(`/api/scripts/${script.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: refined }),
      });
      const saved = await saveRes.json();
      if (!saveRes.ok) throw new Error(saved.error);

      setScript((prev) =>
        prev ? { ...prev, content: refined, updated_at: saved.updated_at } : prev,
      );
      setRefinePrompt("");
      setShowRefine(false);

      // Reload versions if panel is open
      if (showVersions) loadVersions();

      toast.success("Script refined successfully", { id: toastId });
    } catch {
      toast.error("Failed to refine script", { id: toastId });
    } finally {
      setRefining(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <CircleNotch size={24} className="animate-spin text-zinc-300 dark:text-zinc-700" />
      </div>
    );
  }

  if (!script) return null;

  return (
    <div className="flex h-full flex-col">
      {/* Detail header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-5 py-2 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-xs">
            {script.title}
          </span>
          {script.updated_at && (
            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
              Edited{" "}
              {new Date(script.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setShowRefine(!showRefine);
              setTimeout(() => refineInputRef.current?.focus(), 100);
            }}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              showRefine
                ? "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Sparkle size={13} weight="fill" />
            Refine
          </button>
          <button
            onClick={() => {
              setShowVersions(!showVersions);
              if (!showVersions && versions.length === 0) {
                loadVersions();
              }
            }}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              showVersions
                ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <ClockCounterClockwise size={13} />
            History
          </button>
          <button
            onClick={handleToggleLocalize}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              script.ready_to_localize
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <GlobeHemisphereWest size={13} />
            {script.ready_to_localize ? "Ready to localize" : "Mark for localization"}
          </button>
          <button
            onClick={handleDeleteScript}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800 dark:hover:text-red-400"
          >
            <Trash size={14} />
          </button>
        </div>
      </div>

      {/* Refine bar */}
      {showRefine && (
        <div className="shrink-0 border-b border-zinc-200 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950">
          <form
            onSubmit={(e) => { e.preventDefault(); handleRefine(); }}
            className="flex items-center gap-3"
          >
            <Sparkle size={14} weight="fill" className={`shrink-0 ${refining ? "animate-spin text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}`} />
            <input
              ref={refineInputRef}
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              disabled={refining}
              placeholder="How should the script be refined? e.g. &quot;Make it more casual&quot;, &quot;Add a stronger CTA&quot;..."
              className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={refining || !refinePrompt.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {refining ? <CircleNotch size={12} className="animate-spin" /> : <PaperPlaneRight size={12} weight="fill" />}
              {refining ? "Refining..." : "Refine"}
            </button>
            {!refining && (
              <button
                type="button"
                onClick={() => { setShowRefine(false); setRefinePrompt(""); }}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Diff modal */}
      {diffModalVersion && script && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDiffModalVersion(null)}>
          <div className="relative mx-4 flex max-h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  v{diffModalVersion.version_number} vs Current
                </h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {new Date(diffModalVersion.created_at).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
              <button
                onClick={() => setDiffModalVersion(null)}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </div>

            {/* Column labels */}
            <div className="flex shrink-0 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex-1 border-r border-zinc-200 bg-red-50/60 px-4 py-2 dark:border-zinc-800 dark:bg-red-900/10">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500 dark:text-red-400">v{diffModalVersion.version_number} — Previous</span>
              </div>
              <div className="flex-1 bg-emerald-50/60 px-4 py-2 dark:bg-emerald-900/10">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">Current</span>
              </div>
            </div>

            {/* Single scroll for both sides */}
            <div className="flex-1 overflow-y-auto">
              <div className="flex">
                {/* Old version */}
                <div className="flex-1 border-r border-zinc-200 p-5 dark:border-zinc-800">
                  <ScriptEditor initialContent={diffModalVersion.content} editable={false} />
                </div>
                {/* Current version */}
                <div className="flex-1 p-5">
                  <ScriptEditor initialContent={script.content} editable={false} />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
              <button
                onClick={() => {
                  handleRevert(diffModalVersion.id);
                  setDiffModalVersion(null);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <ArrowCounterClockwise size={12} />
                Revert to this version
              </button>
              <button
                onClick={() => setDiffModalVersion(null)}
                className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="relative flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
          {refining && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80">
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <CircleNotch size={16} className="animate-spin text-zinc-900 dark:text-white" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Refining your script...</span>
              </div>
            </div>
          )}
          <div className="mx-auto max-w-3xl">
            <ScriptEditor
              key={script.id + "-" + script.updated_at}
              initialContent={script.content}
              onChange={(md) => handleScriptUpdate(md)}
              editable={!refining}
            />
          </div>
        </div>

        {/* Version history panel */}
        {showVersions && (
          <div className="w-72 shrink-0 overflow-y-auto border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Version history
              </h3>
              <p className="mt-0.5 text-[10px] text-zinc-400 dark:text-zinc-500">
                {versions.length} previous version{versions.length !== 1 ? "s" : ""}
              </p>
            </div>

            {loadingVersions && (
              <div className="flex items-center justify-center py-8">
                <CircleNotch size={16} className="animate-spin text-zinc-300 dark:text-zinc-600" />
              </div>
            )}

            {!loadingVersions && versions.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
                No previous versions yet. Versions are created when you edit the script.
              </p>
            )}

            <div className="space-y-px">
              {/* Current version */}
              <div className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    Current
                  </span>
                  <span className="text-[10px] text-emerald-500">Live</span>
                </div>
                <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                  {new Date(script.updated_at || script.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {versions.map((v) => (
                  <div
                    key={v.id}
                    className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                          v{v.version_number}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDiffModalVersion(v)}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          >
                            <FileMagnifyingGlass size={10} />
                            Diff
                          </button>
                          <button
                            onClick={() => handleRevert(v.id)}
                            disabled={revertingId === v.id}
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          >
                            {revertingId === v.id ? (
                              <CircleNotch size={10} className="animate-spin" />
                            ) : (
                              <ArrowCounterClockwise size={10} />
                            )}
                            Revert
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {new Date(v.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-600 line-clamp-3">
                        {v.content.replace(/[#*>_~`\-]/g, "").trim().slice(0, 120)}...
                      </p>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
