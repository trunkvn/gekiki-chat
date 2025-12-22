"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

interface Props {
  content: string;
}

export default function Markdown({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold mt-3 mb-1">{children}</h3>
        ),
   
        p: ({ children }) => <p className="leading-relaxed mb-2">{children}</p>,

        ul: ({ children }) => (
          <ul className="list-disc pl-5 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-5 space-y-1">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-indigo-500 pl-4 italic opacity-80 my-2">
            {children}
          </blockquote>
        ),
        code: ({ inline, children }) =>
          inline ? (
            <code className="px-1 py-0.5 rounded bg-gray-800 text-indigo-300">
              {children}
            </code>
          ) : (
            <pre className="rounded-lg overflow-x-auto my-3">
              <code className="text-sm">{children}</code>
            </pre>
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
