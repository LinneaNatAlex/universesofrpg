import Image from "next/image";
import { BookOpen } from "lucide-react";

interface BookBackCoverProps {
  title: string;
  synopsis: string;
  coverUrl?: string | null;
  showCover?: boolean;
}

export function BookBackCover({ title, synopsis, coverUrl, showCover = true }: BookBackCoverProps) {
  return (
    <div className="flex gap-4 flex-col sm:flex-row">
      {showCover && coverUrl && (
        <div className="comic-cover shrink-0 mx-auto sm:mx-0">
          <Image
            src={coverUrl}
            alt={`Cover of ${title}`}
            width={160}
            height={224}
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="flex-1 comic-panel p-5 relative">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-comic-red" />
          <span className="font-comic text-xs uppercase tracking-widest text-ink-muted">
            Back cover
          </span>
        </div>
        <h2 className="font-comic text-xl text-ink mb-3">{title}</h2>
        <p className="text-sm leading-relaxed text-ink-muted italic">{synopsis}</p>
      </div>
    </div>
  );
}
