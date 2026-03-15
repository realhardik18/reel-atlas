"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { diffLines } from "diff";
import {
  CircleNotch,
  ArrowLeft,
  Trash,
  ClockCounterClockwise,
  GlobeHemisphereWest,
  ArrowCounterClockwise,
  FileMagnifyingGlass,
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
  const [diffVersionId, setDiffVersionId] = useState<string | null>(null);

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

      {/* Detail body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
          <div className="mx-auto max-w-3xl">
            <ScriptEditor
              key={script.id + "-" + script.updated_at}
              initialContent={script.content}
              onChange={(md) => handleScriptUpdate(md)}
              editable
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

              {versions.map((v) => {
                const isDiffOpen = diffVersionId === v.id;
                const diffParts = isDiffOpen ? diffLines(v.content, script.content) : [];
                return (
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
                            onClick={() => setDiffVersionId(isDiffOpen ? null : v.id)}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                              isDiffOpen
                                ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                            }`}
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
                      {!isDiffOpen && (
                        <p className="mt-1.5 text-[10px] leading-relaxed text-zinc-400 dark:text-zinc-600 line-clamp-3">
                          {v.content.replace(/[#*>_~`\-]/g, "").trim().slice(0, 120)}...
                        </p>
                      )}
                    </div>
                    {isDiffOpen && (
                      <div className="max-h-64 overflow-y-auto border-t border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[10px] leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
                        {diffParts.map((part, pi) =>
                          part.value
                            .split("\n")
                            .filter((line, li, arr) => li < arr.length - 1 || line)
                            .map((line, li) => (
                              <div
                                key={`${pi}-${li}`}
                                className={
                                  part.added
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                    : part.removed
                                      ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                      : "text-zinc-500 dark:text-zinc-500"
                                }
                              >
                                <span className="mr-1.5 inline-block w-3 select-none text-right opacity-60">
                                  {part.added ? "+" : part.removed ? "\u2212" : " "}
                                </span>
                                {line || " "}
                              </div>
                            )),
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
