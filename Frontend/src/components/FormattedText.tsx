import React from "react";

interface FormattedTextProps {
  text?: string;
  className?: string;
  highlightClass?: string;
  forceChancery?: boolean;
}

/**
 * FormattedText: Parses text for *highlighted words* or renders Chancery font accent highlights.
 * Syntax: "the *moments* that belong only to you." -> "moments" renders in Black Chancery font!
 */
export function FormattedText({
  text = "",
  className = "",
  highlightClass = "font-chancery normal-case text-amber-200 font-normal italic tracking-wide px-0.5",
  forceChancery = false,
}: FormattedTextProps) {
  if (!text) return null;

  if (forceChancery) {
    return <span className={`font-chancery ${className}`}>{text}</span>;
  }

  // Matches *word* or [chancery]word[/chancery]
  const regex = /(\*[^*]+\*|\[chancery\][\s\S]*?\[\/chancery\])/gi;
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (
          (part.startsWith("*") && part.endsWith("*")) ||
          (part.startsWith("[chancery]") && part.endsWith("[/chancery]"))
        ) {
          const content = part
            .replace(/^\*/, "")
            .replace(/\*$/, "")
            .replace(/^\[chancery\]/, "")
            .replace(/\[\/chancery\]$/, "");

          return (
            <span key={idx} className={highlightClass}>
              {content}
            </span>
          );
        }
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
}

export default FormattedText;
