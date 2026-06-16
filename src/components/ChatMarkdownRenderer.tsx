import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const components: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-[1rem] font-bold text-[#1a2256] mt-3 mb-1.5 pb-1 border-b border-[#e0e6f5] first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[0.9rem] font-bold text-[#1a2256] mt-3 mb-1.5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[0.85rem] font-semibold text-[#1a2256] mt-2.5 mb-1 first:mt-0">
      {children}
    </h3>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="text-[0.84rem] text-[#2d3a5e] leading-[1.65] my-1.5 first:mt-0 last:mb-0">
      {children}
    </p>
  ),

  // Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-[#1a2256]">{children}</strong>
  ),

  // Italic
  em: ({ children }) => (
    <em className="italic text-[#4a5680]">{children}</em>
  ),

  // Unordered list
  ul: ({ children }) => (
    <ul className="my-1.5 pl-0 space-y-1 list-none">{children}</ul>
  ),

  // Ordered list
  ol: ({ children }) => (
    <ol className="my-1.5 pl-0 space-y-1 list-none counter-reset-[item]">{children}</ol>
  ),

  // List items
  li: ({ children, ordered, ...props }) => (
    <li className="flex items-start gap-2 text-[0.84rem] text-[#2d3a5e] leading-[1.6]">
      <span className="mt-[5px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#1a2256]/40" />
      <span className="flex-1">{children}</span>
    </li>
  ),

  // Inline code
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <pre className="bg-[#1a2256]/5 border border-[#1a2256]/10 rounded-lg px-4 py-3 my-2 overflow-x-auto text-[0.78rem] font-mono text-[#1a2256]">
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code className="bg-[#1a2256]/8 text-[#1a2256] font-mono text-[0.8rem] px-1.5 py-0.5 rounded-md border border-[#1a2256]/10">
        {children}
      </code>
    );
  },

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-[#1a2256]/30 pl-3 my-2 italic text-[#4a5680]">
      {children}
    </blockquote>
  ),

  // Table
  table: ({ children }) => (
    <div className="my-2.5 overflow-x-auto rounded-xl border border-[#dde9f8] shadow-sm">
      <table className="w-full text-[0.79rem] border-collapse">{children}</table>
    </div>
  ),

  thead: ({ children }) => (
    <thead className="bg-[#1a2256]">{children}</thead>
  ),

  tbody: ({ children }) => (
    <tbody className="divide-y divide-[#e8f0fc]">{children}</tbody>
  ),

  tr: ({ children }) => (
    <tr className="hover:bg-[#f0f5ff] transition-colors">{children}</tr>
  ),

  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-[0.78rem] font-semibold text-white tracking-wide">
      {children}
    </th>
  ),

  td: ({ children }) => (
    <td className="px-4 py-2.5 text-[#2d3a5e] align-top">
      {children}
    </td>
  ),

  // Horizontal rule
  hr: () => <hr className="my-3 border-0 border-t border-[#e0e6f5]" />,

  // Links
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#1a2256] underline underline-offset-2 font-medium hover:text-[#0284c7] transition-colors"
    >
      {children}
    </a>
  ),
};

interface ChatMarkdownRendererProps {
  content: string;
}

export const ChatMarkdownRenderer = ({ content }: ChatMarkdownRendererProps) => {
  return (
    <div className="chat-markdown text-[0.84rem]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
