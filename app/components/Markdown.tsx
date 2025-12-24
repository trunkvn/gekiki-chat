"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { CopyIcon, CheckIcon } from "./Icons";

interface Props {
  content: string;
}

const CodeBlock = ({ children, className }: { children: any; className?: string }) => {
  const [copied, setCopied] = useState(false);
  const codeContent = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
        </button>
      </div>
      <pre className="rounded-xl overflow-x-auto bg-[#0d1117] p-4 border border-zinc-800">
        <code className={`text-sm ${className}`}>{children}</code>
      </pre>
    </div>
  );
};

export default function Markdown({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mt-6 mb-3 text-white">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold mt-5 mb-2 text-white">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mt-4 mb-2 text-white">{children}</h3>
        ),
        p: ({ children }) => <p className="leading-7 mb-4 last:mb-0 text-slate-200">{children}</p>,
        ul: ({ children }) => (
          <ul className="list-disc pl-5 space-y-2 mb-4 text-slate-200">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 space-y-2 mb-4 text-slate-200">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-400 bg-indigo-500/5 my-4 rounded-r">
            {children}
          </blockquote>
        ),
        code: (props: any) => {
          const { children, className } = props;
          const match = /language-(\w+)/.exec(className || "");
          const inline = !match;
          
          return inline ? (
            <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-indigo-300 text-sm font-mono">
              {children}
            </code>
          ) : (
            <CodeBlock className={className}>{children}</CodeBlock>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
