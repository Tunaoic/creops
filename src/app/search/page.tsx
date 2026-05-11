import { getAllTopics, getAllChannels } from "@/db/queries";
import { SearchClient } from "@/components/search-client";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const [topics, channels] = await Promise.all([
    getAllTopics(),
    getAllChannels(),
  ]);
  return <SearchClient topics={topics} channels={channels} />;
}
