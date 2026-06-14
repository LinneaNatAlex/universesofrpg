import { contentRatingLabel, hasSexualContent, type RatableContentFields } from "@/lib/content-rating";
import { Badge } from "@/components/ui/badge";

export function ContentRatingBadge({
  item,
  className,
}: {
  item: RatableContentFields;
  className?: string;
}) {
  if (!hasSexualContent(item)) return null;
  return (
    <Badge variant="paid" className={className ?? "text-[10px]"}>
      {contentRatingLabel("peg18")} · Sexual content
    </Badge>
  );
}
