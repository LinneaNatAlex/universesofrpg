import { DiscussionThreadView } from "@/components/discussions/DiscussionThreadView";

export default async function DiscussionThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DiscussionThreadView id={id} />;
}
