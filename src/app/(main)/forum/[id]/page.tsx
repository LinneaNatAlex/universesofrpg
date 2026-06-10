import { ForumDetail } from "@/components/forum/ForumStudio";

interface ForumDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ForumDetailPage({ params }: ForumDetailPageProps) {
  const { id } = await params;
  return <ForumDetail forumId={id} />;
}
