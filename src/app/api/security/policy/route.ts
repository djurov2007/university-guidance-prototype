import { handlePolicy } from "@/server/conversation/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return handlePolicy();
}
