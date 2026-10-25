import { handleDelete } from "@/server/conversation/http";
export const runtime = "nodejs";
export async function DELETE(request: Request) {
  return handleDelete(request);
}
