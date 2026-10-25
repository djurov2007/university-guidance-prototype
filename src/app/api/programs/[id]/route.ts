import { handleDetails } from "@/server/conversation/http";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleDetails(request, (await context.params).id);
}
