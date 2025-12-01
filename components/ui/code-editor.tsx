"use client";

import MonacoEditor, { type EditorProps, type OnMount } from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { vercelDarkTheme } from "@/lib/monaco-theme";

export function CodeEditor(props: EditorProps) {
  const { resolvedTheme } = useTheme();

  const normalizeValue = (value: EditorProps["value"] | EditorProps["defaultValue"]) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object") {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const normalizedValue = normalizeValue(props.value);
  const normalizedDefaultValue = normalizeValue(props.defaultValue);

  const handleEditorMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme("vercel-dark", vercelDarkTheme);
    monaco.editor.setTheme(resolvedTheme === "dark" ? "vercel-dark" : "light");

    if (props.onMount) {
      props.onMount(editor, monaco);
    }
  };

  return (
    <MonacoEditor
      {...props}
      defaultValue={normalizedDefaultValue}
      onMount={handleEditorMount}
      theme={resolvedTheme === "dark" ? "vercel-dark" : "light"}
      value={normalizedValue}
    />
  );
}
