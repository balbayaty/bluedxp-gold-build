"use client";

/**
 * Professional Markdown Renderer for AI Chat
 * Renders markdown with code highlighting, tables, and professional styling
 * Inspired by ChatGPT and Claude's output formatting
 */

import React, { useMemo } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
}

// Language display names and colors
const LANGUAGE_CONFIG: Record<string, { name: string; color: string }> = {
  javascript: { name: "JavaScript", color: "bg-yellow-500" },
  typescript: { name: "TypeScript", color: "bg-blue-500" },
  python: { name: "Python", color: "bg-green-500" },
  java: { name: "Java", color: "bg-red-500" },
  csharp: { name: "C#", color: "bg-purple-500" },
  cpp: { name: "C++", color: "bg-pink-500" },
  c: { name: "C", color: "bg-gray-500" },
  go: { name: "Go", color: "bg-cyan-500" },
  rust: { name: "Rust", color: "bg-orange-500" },
  ruby: { name: "Ruby", color: "bg-red-600" },
  php: { name: "PHP", color: "bg-indigo-500" },
  swift: { name: "Swift", color: "bg-orange-400" },
  kotlin: { name: "Kotlin", color: "bg-purple-400" },
  sql: { name: "SQL", color: "bg-blue-400" },
  html: { name: "HTML", color: "bg-orange-500" },
  css: { name: "CSS", color: "bg-blue-500" },
  scss: { name: "SCSS", color: "bg-pink-400" },
  json: { name: "JSON", color: "bg-gray-600" },
  yaml: { name: "YAML", color: "bg-red-400" },
  xml: { name: "XML", color: "bg-green-600" },
  markdown: { name: "Markdown", color: "bg-gray-500" },
  bash: { name: "Bash", color: "bg-green-700" },
  shell: { name: "Shell", color: "bg-green-700" },
  powershell: { name: "PowerShell", color: "bg-blue-600" },
  dockerfile: { name: "Dockerfile", color: "bg-blue-400" },
  graphql: { name: "GraphQL", color: "bg-pink-500" },
  tsx: { name: "TSX", color: "bg-blue-500" },
  jsx: { name: "JSX", color: "bg-yellow-500" },
};

// Code block component with copy functionality
function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = React.useState(false);
  const langConfig = LANGUAGE_CONFIG[language.toLowerCase()] || {
    name: language || "Code",
    color: "bg-gray-500",
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {langConfig.name}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <div className="relative">
        <pre className="p-4 overflow-x-auto bg-gray-50 dark:bg-gray-900 text-sm">
          <code className="text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}

// Inline code component
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 mx-0.5 text-sm font-mono bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded border border-gray-200 dark:border-gray-700">
      {children}
    </code>
  );
}

// Table component
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="my-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((row, i) => (
            <tr
              key={i}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Parse and render markdown content
export function MarkdownRenderer({
  content,
  className = "",
  isStreaming = false,
}: MarkdownRendererProps) {
  const elements = useMemo(() => {
    const result: React.ReactNode[] = [];
    let keyIndex = 0;

    // Split content into lines for processing
    const lines = content.split("\n");
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code blocks (```)
      if (line.trim().startsWith("```")) {
        const language = line.trim().slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        result.push(
          <CodeBlock
            key={keyIndex++}
            code={codeLines.join("\n")}
            language={language}
          />
        );
        i++;
        continue;
      }

      // Tables (| header | header |)
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [line];
        i++;
        while (
          i < lines.length &&
          lines[i].trim().startsWith("|") &&
          lines[i].trim().endsWith("|")
        ) {
          tableLines.push(lines[i]);
          i++;
        }

        if (tableLines.length >= 2) {
          const headers = tableLines[0]
            .split("|")
            .filter((c) => c.trim())
            .map((c) => c.trim());
          const rows = tableLines
            .slice(2)
            .map((row) =>
              row
                .split("|")
                .filter((c) => c.trim())
                .map((c) => c.trim())
            );
          result.push(<Table key={keyIndex++} headers={headers} rows={rows} />);
          continue;
        }
      }

      // Headers
      if (line.startsWith("### ")) {
        result.push(
          <h3
            key={keyIndex++}
            className="text-base font-bold text-gray-800 dark:text-gray-200 mt-4 mb-2"
          >
            {parseInlineMarkdown(line.slice(4))}
          </h3>
        );
        i++;
        continue;
      }

      if (line.startsWith("## ")) {
        result.push(
          <h2
            key={keyIndex++}
            className="text-lg font-bold text-gray-800 dark:text-gray-200 mt-4 mb-2"
          >
            {parseInlineMarkdown(line.slice(3))}
          </h2>
        );
        i++;
        continue;
      }

      if (line.startsWith("# ")) {
        result.push(
          <h1
            key={keyIndex++}
            className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-4 mb-2"
          >
            {parseInlineMarkdown(line.slice(2))}
          </h1>
        );
        i++;
        continue;
      }

      // Horizontal rule
      if (line.trim() === "---" || line.trim() === "***") {
        result.push(
          <hr
            key={keyIndex++}
            className="my-4 border-gray-200 dark:border-gray-700"
          />
        );
        i++;
        continue;
      }

      // Blockquote
      if (line.startsWith("> ")) {
        const quoteLines: string[] = [line.slice(2)];
        i++;
        while (i < lines.length && lines[i].startsWith("> ")) {
          quoteLines.push(lines[i].slice(2));
          i++;
        }
        result.push(
          <blockquote
            key={keyIndex++}
            className="my-3 pl-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 py-2 pr-4 rounded-r-lg text-gray-700 dark:text-gray-300 italic"
          >
            {quoteLines.map((ql, qi) => (
              <p key={qi} className="text-sm">
                {parseInlineMarkdown(ql)}
              </p>
            ))}
          </blockquote>
        );
        continue;
      }

      // Unordered list
      if (line.match(/^[\s]*[-*]\s/)) {
        const listItems: { content: string; indent: number }[] = [];
        while (i < lines.length && lines[i].match(/^[\s]*[-*]\s/)) {
          const match = lines[i].match(/^([\s]*)[-*]\s(.*)$/);
          if (match) {
            listItems.push({
              indent: match[1].length,
              content: match[2],
            });
          }
          i++;
        }
        result.push(
          <ul key={keyIndex++} className="my-2 space-y-1 list-none">
            {listItems.map((item, li) => (
              <li
                key={li}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                style={{ paddingLeft: `${item.indent * 0.5}rem` }}
              >
                <span className="text-blue-500 dark:text-blue-400 mt-1.5">
                  •
                </span>
                <span>{parseInlineMarkdown(item.content)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered list
      if (line.match(/^[\s]*\d+\.\s/)) {
        const listItems: { content: string; num: string }[] = [];
        while (i < lines.length && lines[i].match(/^[\s]*\d+\.\s/)) {
          const match = lines[i].match(/^[\s]*(\d+)\.\s(.*)$/);
          if (match) {
            listItems.push({
              num: match[1],
              content: match[2],
            });
          }
          i++;
        }
        result.push(
          <ol key={keyIndex++} className="my-2 space-y-1 list-none">
            {listItems.map((item, li) => (
              <li
                key={li}
                className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="text-blue-500 dark:text-blue-400 font-medium min-w-[1.5rem]">
                  {item.num}.
                </span>
                <span>{parseInlineMarkdown(item.content)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Empty line
      if (line.trim() === "") {
        result.push(<div key={keyIndex++} className="h-2" />);
        i++;
        continue;
      }

      // Regular paragraph
      result.push(
        <p
          key={keyIndex++}
          className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 my-1"
        >
          {parseInlineMarkdown(line)}
        </p>
      );
      i++;
    }

    return result;
  }, [content]);

  return (
    <div className={`markdown-content ${className}`}>
      {elements}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse rounded-sm" />
      )}
    </div>
  );
}

// Parse inline markdown (bold, italic, code, links)
function parseInlineMarkdown(text: string): React.ReactNode {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Bold (**text** or __text__)
    let match = remaining.match(/^(.*?)\*\*(.+?)\*\*(.*)/s);
    if (!match) {
      match = remaining.match(/^(.*?)__(.+?)__(.*)/s);
    }
    if (match) {
      if (match[1]) elements.push(parseInlineMarkdown(match[1]));
      elements.push(
        <strong key={keyIndex++} className="font-semibold text-gray-900 dark:text-gray-100">
          {match[2]}
        </strong>
      );
      remaining = match[3];
      continue;
    }

    // Italic (*text* or _text_)
    match = remaining.match(/^(.*?)\*([^*]+?)\*(.*)/s);
    if (!match) {
      match = remaining.match(/^(.*?)_([^_]+?)_(.*)/s);
    }
    if (match && !match[1].endsWith("\\")) {
      if (match[1]) elements.push(parseInlineMarkdown(match[1]));
      elements.push(
        <em key={keyIndex++} className="italic">
          {match[2]}
        </em>
      );
      remaining = match[3];
      continue;
    }

    // Inline code (`code`)
    match = remaining.match(/^(.*?)`([^`]+?)`(.*)/s);
    if (match) {
      if (match[1]) elements.push(match[1]);
      elements.push(<InlineCode key={keyIndex++}>{match[2]}</InlineCode>);
      remaining = match[3];
      continue;
    }

    // Links ([text](url))
    match = remaining.match(/^(.*?)\[([^\]]+?)\]\(([^)]+?)\)(.*)/s);
    if (match) {
      if (match[1]) elements.push(match[1]);
      elements.push(
        <a
          key={keyIndex++}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {match[2]}
        </a>
      );
      remaining = match[4];
      continue;
    }

    // No more matches, add remaining text
    elements.push(remaining);
    break;
  }

  return elements.length === 1 ? elements[0] : <>{elements}</>;
}

export default MarkdownRenderer;
