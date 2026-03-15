"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleNotch, ArrowLeft } from "@phosphor-icons/react";
import ScriptEditor from "../../components/ScriptEditor";
import { useDashboard } from "../../layout";

interface Script {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export default function StudioScriptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useDashboard();

  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);

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
        router.push("/dashboard/studio");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

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
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-5 py-2 dark:border-zinc-800">
        <button
          onClick={() => router.push("/dashboard/studio")}
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {script.title}
          </h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
            Last edited{" "}
            {new Date(script.updated_at || script.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl">
          <ScriptEditor
            key={script.id}
            initialContent={script.content}
            editable={false}
          />
        </div>
      </div>
    </div>
  );
}
