import { ConversationWorkspace } from "@/components/conversation/conversation-workspace";
import { localAiPolicy } from "@/server/ai/local-runtime";
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <ConversationWorkspace
      externalAi={localAiPolicy().externalAi}
      remotePreview={process.env.PROTOTYPE_TRANSPORT === "https"}
    />
  );
}
