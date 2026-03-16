import { useRef, useCallback, useState, useEffect } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { X, Circle, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const EXT_LANG: Record<string, string> = {
  js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
  json: "json", html: "html", css: "css", scss: "scss", less: "less",
  md: "markdown", py: "python", rb: "ruby", go: "go", rs: "rust",
  java: "java", xml: "xml", yaml: "yaml", yml: "yaml", sh: "shell",
  sql: "sql", vue: "html", svelte: "html", php: "php",
};

function getLang(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  return EXT_LANG[ext] || "plaintext";
}

interface OpenTab {
  path: string;
  content: string;
  dirty: boolean;
}

interface CodeEditorProps {
  tabs: OpenTab[];
  activeTab: string | null;
  onTabSelect: (path: string) => void;
  onTabClose: (path: string) => void;
  onChange: (path: string, content: string) => void;
  onSave: (path: string, content: string) => void;
}

export function CodeEditor({ tabs, activeTab, onTabSelect, onTabClose, onChange, onSave }: CodeEditorProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const editorRef = useRef<any>(null);
  const isExternalUpdate = useRef(false);

  const currentTab = tabs.find((t) => t.path === activeTab);

  useEffect(() => {
    if (editorRef.current && currentTab) {
      const currentVal = editorRef.current.getValue();
      if (currentVal !== currentTab.content && !currentTab.dirty) {
        isExternalUpdate.current = true;
        editorRef.current.setValue(currentTab.content);
        isExternalUpdate.current = false;
      }
    }
  }, [currentTab?.content, currentTab?.dirty]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const val = editor.getValue();
      if (activeTab) onSave(activeTab, val);
    });
  };

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (isExternalUpdate.current) return;
      if (activeTab && value !== undefined) {
        onChange(activeTab, value);
      }
    },
    [activeTab, onChange]
  );

  if (!tabs.length) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">
          {ar ? "اختر ملفاً من القائمة" : "Select a file from the tree"}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex overflow-x-auto border-b border-border bg-muted/30 scrollbar-none">
        {tabs.map((tab) => {
          const name = tab.path.split("/").pop() || tab.path;
          const isActive = tab.path === activeTab;
          return (
            <div
              key={tab.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-e border-border whitespace-nowrap ${
                isActive ? "bg-background text-foreground" : "text-muted-foreground hover:bg-accent/50"
              }`}
              onClick={() => onTabSelect(tab.path)}
              data-testid={`tab-${tab.path}`}
            >
              {tab.dirty && <Circle className="w-2 h-2 fill-orange-400 text-orange-400" />}
              <span>{name}</span>
              <button
                className="ms-1 p-0.5 rounded hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.path);
                }}
                data-testid={`button-close-tab-${tab.path}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex-1 min-h-0">
        {currentTab ? (
          <Editor
            key={currentTab.path}
            defaultValue={currentTab.content}
            language={getLang(currentTab.path)}
            theme="vs-dark"
            onChange={handleChange}
            onMount={handleMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 8 },
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            }
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {ar ? "اختر ملفاً" : "Select a file"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
