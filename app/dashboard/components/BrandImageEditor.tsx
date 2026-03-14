"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect } from "react";

interface BrandImageEditorProps {
  markdown: string;
  refreshKey: number;
}

export default function BrandImageEditor({
  markdown,
  refreshKey,
}: BrandImageEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: markdown,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-2xl prose-h1:text-zinc-900 dark:prose-h1:text-zinc-50 prose-h2:mt-6 prose-h2:text-lg prose-h2:text-zinc-800 dark:prose-h2:text-zinc-200 prose-h3:mt-4 prose-h3:text-base prose-h3:text-zinc-700 dark:prose-h3:text-zinc-300 prose-p:text-zinc-600 dark:prose-p:text-zinc-400 prose-p:leading-relaxed prose-li:text-zinc-600 dark:prose-li:text-zinc-400 prose-strong:text-zinc-800 dark:prose-strong:text-zinc-200 prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && markdown) {
      editor.commands.setContent(markdown);
    }
  }, [editor, markdown, refreshKey]);

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 ${refreshKey > 0 ? "animate-card-refresh" : ""}`}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
