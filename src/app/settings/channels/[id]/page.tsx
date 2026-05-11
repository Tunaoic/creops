import { notFound } from "next/navigation";
import { getChannelById, getChannelStyleGuides } from "@/db/queries";
import { ChannelStyleGuideClient } from "@/components/channel-style-guide-client";

export const dynamic = "force-dynamic";

export default async function ChannelStyleGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const channel = await getChannelById(id);
  if (!channel) notFound();

  const guides = await getChannelStyleGuides(id);
  const guidesByType: Record<string, { samples: string[]; promptOverride: string | null }> = {};
  for (const g of guides) {
    guidesByType[g.contentType] = {
      samples: (g.samples as string[]) ?? [],
      promptOverride: g.promptOverride,
    };
  }

  return (
    <ChannelStyleGuideClient channel={channel} initialGuides={guidesByType} />
  );
}
