import { getAllTopics, getAllChannels, getAllUsers } from "@/db/queries";
import { BoardView } from "@/components/board-view";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const [topics, channels, users] = await Promise.all([
    getAllTopics(),
    getAllChannels(),
    getAllUsers(),
  ]);
  return <BoardView topics={topics} channels={channels} users={users} />;
}
