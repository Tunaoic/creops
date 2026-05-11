import { notFound } from "next/navigation";
import {
  getTopicById,
  getAllChannels,
  getUserById,
} from "@/db/queries";
import { ApproveFlowClient } from "@/components/approve-flow-client";

export const dynamic = "force-dynamic";

export default async function ApprovePage({
  params,
}: {
  params: Promise<{ id: string; deliverableId: string }>;
}) {
  const { id, deliverableId } = await params;
  const [topic, channels] = await Promise.all([
    getTopicById(id),
    getAllChannels(),
  ]);
  if (!topic) notFound();

  const deliverable = topic.deliverables.find((d) => d.id === deliverableId);
  if (!deliverable) notFound();

  const usersMap = new Map<string, string>();
  for (const t of deliverable.tasks) {
    for (const id of t.assigneeIds) {
      if (!usersMap.has(id)) {
        const u = await getUserById(id);
        if (u) usersMap.set(id, u.name);
      }
    }
  }

  return (
    <ApproveFlowClient
      topicId={topic.id}
      topicName={topic.name}
      deliverable={deliverable}
      channels={channels}
      userNames={Object.fromEntries(usersMap)}
    />
  );
}
