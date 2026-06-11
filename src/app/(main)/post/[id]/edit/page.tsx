"use client";

import { useParams } from "next/navigation";
import { EditPostStudio } from "@/components/create/EditPostStudio";

export default function EditPostPage() {
  const params = useParams();
  const postId = (params.id as string) ?? "";

  return <EditPostStudio postId={postId} />;
}
