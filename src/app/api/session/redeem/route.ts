import { handleRedeem } from "@/server/conversation/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return handleRedeem(request);
}
