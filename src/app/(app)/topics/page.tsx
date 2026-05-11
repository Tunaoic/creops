import { getAllTopics, getAllChannels, getAllUsers, getWorkspaceSettings } from "@/db/queries";
import { TopicsSplitView } from "@/components/topics-split-view";

export const dynamic = "force-dynamic";

export default async function AllTopicsPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string; view?: string }>;
}) {
  const params = await searchParams;
  const [topics, channels, users, settings] = await Promise.all([
    getAllTopics(),
    getAllChannels(),
    getAllUsers(),
    getWorkspaceSettings(),
  ]);

  const selectedTopic = params.selected
    ? topics.find((t) => t.id === params.selected) ?? null
    : topics[0] ?? null;

  return (
    <TopicsSplitView
      topics={topics}
      selected={selectedTopic}
      channels={channels}
      users={users}
      blockReasonDisplay={settings?.blockReasonDisplay ?? "name"}
    />
  );
}
