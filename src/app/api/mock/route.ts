import { localRequestGuard, readBody } from "@/server/conversation/http";
import { FlowError } from "@/server/conversation/service";
import { failure } from "@/domain/result";
import {
  diagnosticRequestSchema,
  diagnosticResultSchema,
} from "@/features/ai/contracts";
import { getAiAdapter } from "@/server/ai/adapter";

export async function POST(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim() !==
    "application/json"
  ) {
    return Response.json(
      failure("INVALID_REQUEST", "Send a JSON diagnostic request."),
      { status: 415 },
    );
  }

  let body: unknown;
  try {
    localRequestGuard(request);
    body = await readBody(request);
  } catch (error) {
    return Response.json(
      failure("INVALID_REQUEST", "The local diagnostic request was rejected."),
      { status: error instanceof FlowError ? error.status : 400 },
    );
  }
  const input = diagnosticRequestSchema.safeParse(body);
  if (!input.success) {
    return Response.json(
      failure("INVALID_REQUEST", "Use the supported synthetic fixture only."),
      { status: 400 },
    );
  }

  let adapter;
  try {
    adapter = getAiAdapter();
  } catch {
    return Response.json(
      failure(
        "CONFIGURATION_ERROR",
        "The local mock configuration is unavailable.",
      ),
      { status: 503 },
    );
  }
  try {
    const output = diagnosticResultSchema.parse(
      await adapter.diagnose(input.data),
    );
    return Response.json(output, { status: output.ok ? 200 : 500 });
  } catch {
    return Response.json(
      failure("INTERNAL_ERROR", "The mock check could not be completed."),
      { status: 500 },
    );
  }
}
