import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function MarkdownView({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!content) return null;

  // Split content by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  const copyToClipboard = (text: string, index: number) => {
    void navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderInline = (text: string) => {
    // Bold: **text**
    const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return tokens.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={idx}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return <code key={idx} className="inline-code">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="markdown-reader">
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).trim().split("\n");
          const firstLine = lines[0]?.trim() || "";
          const hasLang = !firstLine.includes(" ") && firstLine.length < 15;
          const lang = hasLang ? firstLine : "code";
          const codeText = (hasLang ? lines.slice(1) : lines).join("\n");

          return (
            <div className="code-block-card" key={index}>
              <div className="code-block-header">
                <span className="code-lang-tag">{lang}</span>
                <button
                  type="button"
                  className="code-copy-btn"
                  onClick={() => copyToClipboard(codeText, index)}
                  title="Copy code"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check size={12} color="#10b981" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={12} /> Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="code-content">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        }

        // Parse paragraphs, headings, bullet lists, and blockquotes
        const lines = part.split("\n");
        const renderedElements: React.ReactNode[] = [];
        let listBuffer: string[] = [];

        const flushList = () => {
          if (listBuffer.length > 0) {
            renderedElements.push(
              <ul className="doc-list" key={`list-${renderedElements.length}`}>
                {listBuffer.map((item, i) => (
                  <li key={i}>{renderInline(item)}</li>
                ))}
              </ul>
            );
            listBuffer = [];
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const rawLine = lines[i]!;
          const trimmed = rawLine.trim();

          if (!trimmed) {
            flushList();
            continue;
          }

          if (trimmed.startsWith("### ")) {
            flushList();
            renderedElements.push(<h4 key={i} className="doc-h3">{trimmed.slice(4)}</h4>);
          } else if (trimmed.startsWith("## ")) {
            flushList();
            renderedElements.push(<h3 key={i} className="doc-h2">{trimmed.slice(3)}</h3>);
          } else if (trimmed.startsWith("# ")) {
            flushList();
            renderedElements.push(<h2 key={i} className="doc-h1">{trimmed.slice(2)}</h2>);
          } else if (trimmed.startsWith("> ")) {
            flushList();
            renderedElements.push(
              <blockquote key={i} className="doc-quote">
                {renderInline(trimmed.slice(2))}
              </blockquote>
            );
          } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            listBuffer.push(trimmed.slice(2));
          } else {
            flushList();
            renderedElements.push(
              <p key={i} className="doc-para">
                {renderInline(trimmed)}
              </p>
            );
          }
        }

        flushList();
        return <div key={index}>{renderedElements}</div>;
      })}
    </div>
  );
}
