import {
  isWritingHtml,
  sanitizeWritingHtml,
} from "@/lib/writing-content";

interface WritingContentViewProps {
  content: string | null;
  className?: string;
}

export function WritingContentView({ content, className }: WritingContentViewProps) {
  if (!content?.trim()) return null;

  if (isWritingHtml(content)) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizeWritingHtml(content) }}
      />
    );
  }

  return <p className={`whitespace-pre-wrap leading-relaxed ${className ?? ""}`}>{content}</p>;
}
