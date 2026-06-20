import { BookOpen } from "lucide-react";
import type { FeedPost } from "@/types/database";

interface TemplateReadmeBoxProps {
  post: Pick<FeedPost, "type" | "template_readme">;
}

export function TemplateReadmeBox({ post }: TemplateReadmeBoxProps) {
  if (post.type !== "code_template") return null;

  const text = post.template_readme?.trim();
  if (!text) return null;

  return (
    <div className="comic-panel p-4 sm:p-5 space-y-2">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-comic-red shrink-0" />
        <h3 className="font-comic text-sm text-ink">How to use this template</h3>
      </div>
      <p className="text-sm text-ink-muted leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  );
}
