import { getAllChannels } from "@/db/queries";
import { NewTopicForm } from "@/components/new-topic-form";

export const dynamic = "force-dynamic";

export default async function NewTopicPage() {
  const channels = await getAllChannels();
  return <NewTopicForm channels={channels} />;
}
