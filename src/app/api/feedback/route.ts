import { handleFlow } from "@/server/conversation/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return handleFlow(request, "feedback");
}
