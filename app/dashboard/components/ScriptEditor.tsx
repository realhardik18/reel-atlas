"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/core";

interface ScriptEditorProps {
  initialContent: string;
  onChange?: (markdown: string) => void;
  editable?: boolean;
  streaming?: boolean;
}

export default function ScriptEditor({
  initialContent,
  onChange,
  editable = true,
  streaming = false,
}: ScriptEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: initialContent,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor: e }: { editor: Editor }) => {
      if (!onChangeRef.current || !editable) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const md = (e.storage as any).markdown.getMarkdown();
        onChangeRef.current?.(md);
      }, 800);
    },
    editorProps: {
      attributes: {
        class: [
          "outline-none min-h-full",
          "prose prose-sm max-w-none",
          // Notion-style typography
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-h1:text-[1.875rem] prose-h1:font-bold prose-h1:leading-tight prose-h1:mt-8 prose-h1:mb-1",
          "prose-h1:text-zinc-900 dark:prose-h1:text-zinc-50",
          "prose-h2:text-[1.25rem] prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-1",
          "prose-h2:text-zinc-800 dark:prose-h2:text-zinc-100",
          "prose-h3:text-[1rem] prose-h3:font-medium prose-h3:mt-4 prose-h3:mb-0.5",
          "prose-h3:text-zinc-700 dark:prose-h3:text-zinc-300",
          "prose-p:text-[0.9375rem] prose-p:leading-[1.75] prose-p:my-0.5",
          "prose-p:text-zinc-600 dark:prose-p:text-zinc-400",
          "prose-li:text-[0.9375rem] prose-li:text-zinc-600 dark:prose-li:text-zinc-400",
          "prose-strong:text-zinc-900 dark:prose-strong:text-zinc-100 prose-strong:font-semibold",
          "prose-em:text-zinc-500 dark:prose-em:text-zinc-400",
          "prose-code:text-[0.8125rem] prose-code:font-mono prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded",
          "prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800 prose-hr:my-6",
          "prose-blockquote:border-zinc-300 dark:prose-blockquote:border-zinc-700 prose-blockquote:text-zinc-500 dark:prose-blockquote:text-zinc-400",
          "prose-ul:my-1 prose-ol:my-1",
        ].join(" "),
      },
    },
  });

  // Update content when streaming new data
  useEffect(() => {
    if (editor && initialContent) {
      if (streaming) {
        // During streaming, replace content without resetting cursor
        const currentContent = editor.getHTML();
        if (currentContent !== initialContent) {
          editor.commands.setContent(initialContent);
        }
      } else {
        editor.commands.setContent(initialContent);
      }
    }
  }, [editor, initialContent, streaming]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="h-full px-10 py-6">
      <EditorContent editor={editor} />
    </div>
  );
}
