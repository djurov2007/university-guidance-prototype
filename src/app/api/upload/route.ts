import { handleUpload } from "@/server/conversation/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return handleUpload(request);
}
