/**
 * Rich Text Editor Component
 * WYSIWYG editor for detailed requirements
 */

"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Bold, Italic, List, Link, Image, Undo, Redo } from "lucide-react";

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Enter detailed requirements...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    saveState();
  };

  const saveState = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(html);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      onChange?.(html);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange?.(history[newIndex]);
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        onChange?.(history[newIndex]);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    saveState();
  };

  const handleInput = () => {
    saveState();
  };

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-700">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
        <button
          onClick={() => execCommand("bold")}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCommand("italic")}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
        <button
          onClick={() => execCommand("insertUnorderedList")}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => execCommand("insertOrderedList")}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
          title="Numbered List"
        >
          <List className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
        <button
          onClick={() => {
            const url = prompt("Enter URL:");
            if (url) execCommand("createLink", url);
          }}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
        <button
          onClick={undo}
          disabled={historyIndex === 0}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={historyIndex === history.length - 1}
          className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        className="p-4 outline-none min-h-[200px] text-slate-800 dark:text-slate-200"
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
