import { handleFlow } from "@/server/conversation/http";
export const runtime = "nodejs";
export async function PATCH(request: Request) {
  return handleFlow(request, "profile");
}
