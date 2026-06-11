import { MessageThreadView } from "@/components/messages/MessageThreadView";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MessageThreadView id={id} />;
}
