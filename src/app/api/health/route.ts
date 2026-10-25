import { failure } from "@/domain/result";
import { getServerConfig } from "@/server/config/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getServerConfig();
    return Response.json({
      ok: true,
      data: { status: "ready", mode: config.mode },
    });
  } catch {
    return Response.json(
      failure(
        "CONFIGURATION_ERROR",
        "The local mock configuration is unavailable.",
      ),
      { status: 503 },
    );
  }
}
