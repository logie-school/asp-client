import { useState } from "react";
import Editor, { OnChange, OnMount } from "@monaco-editor/react";
import './monaco.css';

interface MonacoEditorProps {
  value?: string;
  language?: string;
  onChange?: OnChange;
}

export function MonacoEditor({
  value = "",
  language = "lua",
  onChange,
}: MonacoEditorProps) {
  const [editorValue, setEditorValue] = useState(value);

  const handleEditorChange: OnChange = (value, ev) => {
    setEditorValue(value || "");
    if (onChange) {
      onChange(value, ev); // Pass both arguments to the parent handler
    }
  };

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    // Store the editor instance globally so it can be accessed in window.onresize
    window.editor = editor;

    monacoInstance.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        {
          token: "",
          background: "#0a0a0a", // Editor background
        },
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.lineHighlightBackground": "#ffffff08", // Active line background
        "editor.lineHighlightBorder": "#00000000", // No border for active line
      },
    });
    monacoInstance.editor.setTheme("custom-dark");
  };

  return (
    <Editor
      height="100%"
      defaultLanguage={language}
      defaultValue={editorValue}
      onChange={handleEditorChange}
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        cursorBlinking: "expand",
        cursorSmoothCaretAnimation: "on",
        useShadowDOM: false,
        automaticLayout: true,
      }}
    />
  );
}