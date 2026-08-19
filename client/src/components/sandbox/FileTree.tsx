import { useState, useRef, useEffect } from "react";
import {
  ChevronDown, ChevronLeft, File, Folder, FolderOpen,
  FileCode, FileJson, FileText, Image, FileType,
  Plus, FolderPlus, Pencil, Trash2, Loader2,
  type LucideIcon
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";

interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: TreeEntry[];
}

interface FileTreeProps {
  files: TreeEntry[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
  onCreateFile: (path: string) => void;
  onCreateFolder: (path: string) => void;
  onRename: (oldPath: string, newPath: string) => void;
  onDelete: (path: string) => void;
  isLoading?: boolean;
}

const EXT_ICONS: Record<string, LucideIcon> = {
  js: FileCode, jsx: FileCode, ts: FileCode, tsx: FileCode,
  json: FileJson, html: FileCode, css: FileCode, md: FileText,
  png: Image, jpg: Image, jpeg: Image, svg: Image, gif: Image,
  txt: FileText,
};

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return EXT_ICONS[ext] || File;
}

interface ContextMenuState {
  x: number;
  y: number;
  path: string;
  type: "file" | "directory" | "root";
}

function TreeNode({
  entry, depth, activeFile, onFileSelect, onContextMenu, renamingPath, renameValue,
  setRenameValue, onRenameSubmit, onRenameCancel,
}: {
  entry: TreeEntry;
  depth: number;
  activeFile: string | null;
  onFileSelect: (path: string) => void;
  onContextMenu: (e: React.MouseEvent, path: string, type: "file" | "directory") => void;
  renamingPath: string | null;
  renameValue: string;
  setRenameValue: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isDir = entry.type === "directory";
  const isActive = activeFile === entry.path;
  const Icon = isDir ? (expanded ? FolderOpen : Folder) : getFileIcon(entry.name);
  const isRenaming = renamingPath === entry.path;
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [isRenaming]);

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 px-2 py-1 text-sm cursor-pointer rounded-sm hover:bg-accent/50 transition-colors ${
          isActive ? "bg-accent text-accent-foreground" : ""
        }`}
        style={{ paddingInlineStart: `${depth * 14 + 8}px` }}
        onClick={() => {
          if (isDir) setExpanded(!expanded);
          else onFileSelect(entry.path);
        }}
        onContextMenu={(e) => onContextMenu(e, entry.path, entry.type)}
        data-testid={`tree-${entry.type}-${entry.path}`}
      >
        {isDir && (
          <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </span>
        )}
        <Icon className={`w-4 h-4 flex-shrink-0 ${isDir ? "text-yellow-500" : "text-muted-foreground"}`} />
        {isRenaming ? (
          <Input
            ref={renameRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRenameSubmit();
              if (e.key === "Escape") onRenameCancel();
            }}
            onBlur={onRenameCancel}
            className="h-5 text-xs py-0 px-1"
          />
        ) : (
          <span className="truncate text-xs">{entry.name}</span>
        )}
      </div>
      {isDir && expanded && entry.children && (
        <div>
          {entry.children
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <TreeNode
                key={child.path}
                entry={child}
                depth={depth + 1}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                onContextMenu={onContextMenu}
                renamingPath={renamingPath}
                renameValue={renameValue}
                setRenameValue={setRenameValue}
                onRenameSubmit={onRenameSubmit}
                onRenameCancel={onRenameCancel}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  files, activeFile, onFileSelect, onCreateFile, onCreateFolder, onRename, onDelete, isLoading,
}: FileTreeProps) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creatingIn, setCreatingIn] = useState<{ dir: string; type: "file" | "folder" } | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const newItemRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingIn && newItemRef.current) {
      newItemRef.current.focus();
    }
  }, [creatingIn]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, path: string, type: "file" | "directory" | "root") => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, path, type });
  };

  const startRename = (path: string) => {
    setRenamingPath(path);
    setRenameValue(path.split("/").pop() || "");
    setContextMenu(null);
  };

  const handleRenameSubmit = () => {
    if (renamingPath && renameValue.trim()) {
      const parts = renamingPath.split("/");
      parts[parts.length - 1] = renameValue.trim();
      const newPath = parts.join("/");
      if (newPath !== renamingPath) onRename(renamingPath, newPath);
    }
    setRenamingPath(null);
  };

  const handleNewItem = () => {
    if (creatingIn && newItemName.trim()) {
      const path = creatingIn.dir ? `${creatingIn.dir}/${newItemName.trim()}` : newItemName.trim();
      if (creatingIn.type === "file") onCreateFile(path);
      else onCreateFolder(path);
    }
    setCreatingIn(null);
    setNewItemName("");
  };

  const getDir = (path: string, type: string) => {
    if (type === "directory" || type === "root") return path;
    const parts = path.split("/");
    parts.pop();
    return parts.join("/");
  };

  return (
    <div className="h-full flex flex-col text-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          {ar ? "الملفات" : "Files"}
        </span>
        <div className="flex gap-1">
          <button
            className="p-1 hover:bg-accent rounded"
            onClick={() => { setCreatingIn({ dir: "", type: "file" }); setNewItemName(""); }}
            title={ar ? "ملف جديد" : "New File"}
            data-testid="button-new-file"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1 hover:bg-accent rounded"
            onClick={() => { setCreatingIn({ dir: "", type: "folder" }); setNewItemName(""); }}
            title={ar ? "مجلد جديد" : "New Folder"}
            data-testid="button-new-folder"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto py-1"
        onContextMenu={(e) => handleContextMenu(e, "", "root")}
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {creatingIn && (
              <div className="flex items-center gap-1.5 px-3 py-1">
                {creatingIn.type === "folder" ? (
                  <Folder className="w-4 h-4 text-yellow-500" />
                ) : (
                  <File className="w-4 h-4 text-muted-foreground" />
                )}
                <Input
                  ref={newItemRef}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNewItem();
                    if (e.key === "Escape") { setCreatingIn(null); setNewItemName(""); }
                  }}
                  onBlur={() => { setCreatingIn(null); setNewItemName(""); }}
                  className="h-5 text-xs py-0 px-1"
                  placeholder={creatingIn.type === "file" ? "filename.ext" : "folder-name"}
                />
              </div>
            )}
            {files
              .sort((a, b) => {
                if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
                return a.name.localeCompare(b.name);
              })
              .map((entry) => (
                <TreeNode
                  key={entry.path}
                  entry={entry}
                  depth={0}
                  activeFile={activeFile}
                  onFileSelect={onFileSelect}
                  onContextMenu={handleContextMenu}
                  renamingPath={renamingPath}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={() => setRenamingPath(null)}
                />
              ))}
          </>
        )}
      </div>

      {contextMenu && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent"
            onMouseDown={(e) => {
              e.preventDefault();
              const dir = getDir(contextMenu.path, contextMenu.type);
              setCreatingIn({ dir, type: "file" });
              setNewItemName("");
              setContextMenu(null);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            {ar ? "ملف جديد" : "New File"}
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent"
            onMouseDown={(e) => {
              e.preventDefault();
              const dir = getDir(contextMenu.path, contextMenu.type);
              setCreatingIn({ dir, type: "folder" });
              setNewItemName("");
              setContextMenu(null);
            }}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            {ar ? "مجلد جديد" : "New Folder"}
          </button>
          {contextMenu.type !== "root" && (
            <>
              <div className="border-t border-border my-1" />
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  startRename(contextMenu.path);
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
                {ar ? "إعادة تسمية" : "Rename"}
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-accent"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (confirm(ar ? "حذف هذا العنصر؟" : "Delete this item?")) {
                    onDelete(contextMenu.path);
                  }
                  setContextMenu(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {ar ? "حذف" : "Delete"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
