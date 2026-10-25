import "server-only";
import { z } from "zod";
import {
  ControlLedger,
  AccessError,
  ledgerPath,
  securityPolicy,
} from "../security/control.ts";
import { scenarioSchema } from "../../features/conversation/schema.ts";
import { NextResponse } from "next/server.js";
import { issueSchema } from "../../features/conversation/schema.ts";
import { ConversationService, FlowError, type Endpoint } from "./service.ts";
import { readAiConfig } from "../ai/config.ts";
import {
  createLocalConversationProvider,
  localAiPolicy,
} from "../ai/local-runtime.ts";

const COOKIE = "study_demo_session";
const globalStore = globalThis as typeof globalThis & {
  studyConversationService?: ConversationService;
  studyControlLedger?: ControlLedger;
};
export const controlLedger = (globalStore.studyControlLedger ??=
  new ControlLedger(ledgerPath()));
export const conversationService = (globalStore.studyConversationService ??=
  new ConversationService({
    control: controlLedger,
    aiConfig: readAiConfig,
    providerFactory: createLocalConversationProvider,
  }));

function configuredPublicOrigin() {
  const value = process.env.PROTOTYPE_PUBLIC_ORIGIN;
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function localRequestGuard(request: Request) {
  const url = new URL(request.url);
  const transport = process.env.PROTOTYPE_TRANSPORT ?? "local_http";
  if (!["local_http", "https"].includes(transport))
    throw new FlowError(
      "INVALID_REQUEST",
      "Secure transport is required for this environment.",
      403,
    );
  if (process.env.APP_MODE && process.env.APP_MODE !== "mock")
    throw new FlowError(
      "INVALID_REQUEST",
      "This demonstration is available locally only.",
      403,
    );
  const origin = request.headers.get("origin");
  let publicOrigin: string;
  if (transport === "local_http") {
    // Next can reconstruct request.url with its internal bind port. Validate the
    // actual HTTP Host independently, then compare the browser's public origin.
    const host = request.headers.get("host") ?? url.host;
    if (
      !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
      !/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(host)
    )
      throw new FlowError(
        "INVALID_REQUEST",
        "This demonstration is available locally only.",
        403,
      );
    try {
      publicOrigin = new URL(`${url.protocol}//${host}`).origin;
    } catch {
      throw new FlowError("INVALID_REQUEST", "Invalid local address.", 403);
    }
  } else {
    const configured = configuredPublicOrigin(),
      forwardedProtocol = request.headers.get("x-forwarded-proto"),
      publicHost =
        request.headers.get("x-forwarded-host") ??
        request.headers.get("host") ??
        url.host,
      protocol = forwardedProtocol ?? url.protocol.slice(0, -1);
    if (
      !configured ||
      protocol !== "https" ||
      protocol.includes(",") ||
      publicHost.includes(",") ||
      `https://${publicHost}` !== configured
    )
      throw new FlowError(
        "INVALID_REQUEST",
        "Secure transport is required for this environment.",
        403,
      );
    publicOrigin = configured;
  }
  if (
    (request.method !== "GET" && request.method !== "HEAD" && !origin) ||
    (origin && origin !== publicOrigin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new FlowError(
      "INVALID_REQUEST",
      "Open the demonstration directly to continue.",
      403,
    );
}
function tokenFrom(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  if (cookie.length > 4096) return null;
  const values = cookie
    .split(";")
    .map((c) => c.trim())
    .filter((c) => c.startsWith(`${COOKIE}=`));
  if (values.length !== 1) return null;
  const value = values[0]?.slice(COOKIE.length + 1);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
export async function readBody(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new FlowError("INVALID_REQUEST", "Send a valid request.", 415);
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > 40000)
    throw new FlowError("INVALID_REQUEST", "The request is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new FlowError("INVALID_REQUEST", "The request is empty.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > 40000) {
        await reader.cancel();
        throw new FlowError(
          "INVALID_REQUEST",
          "The request is too large.",
          413,
        );
      }
      chunks.push(part.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof FlowError || error instanceof AccessError) throw error;
    throw new FlowError("INVALID_REQUEST", "The request could not be read.");
  } finally {
    reader.releaseLock();
  }
}
function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
function cookie(
  response: NextResponse,
  request: Request,
  token: string,
  maxAge: number,
) {
  response.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure:
      process.env.PROTOTYPE_TRANSPORT === "https" ||
      new URL(request.url).protocol === "https:",
    path: "/",
    maxAge,
  });
}
export function errorResponse(error: unknown) {
  const issue =
    error instanceof FlowError || error instanceof AccessError
      ? { code: error.code, message: error.message }
      : {
          code: "INTERNAL_ERROR",
          message:
            "Something went wrong. Your last confirmed details are preserved. Try again.",
        };
  return json(
    { error: issueSchema.parse(issue) },
    error instanceof FlowError || error instanceof AccessError
      ? error.status
      : 500,
  );
}
export async function handleFlow(
  request: Request,
  endpoint: Endpoint,
  service = conversationService,
  control: ControlLedger | undefined = service === conversationService
    ? controlLedger
    : undefined,
) {
  try {
    localRequestGuard(request);
    const body = await readBody(request);
    const token = tokenFrom(request);
    const access = control?.require(token);
    if (control && token) control.rate(`session:${token}`);
    if (
      endpoint === "chat" &&
      body &&
      typeof body === "object" &&
      "action" in body &&
      body.action === "start"
    ) {
      const started = service.start(
        body,
        token,
        access && token ? { token, expires: access.expires } : undefined,
      );
      const response = json({ session: started.view });
      cookie(
        response,
        request,
        started.token,
        access
          ? Math.max(0, Math.floor((access.expires - Date.now()) / 1000))
          : 1800,
      );
      return response;
    }
    if (
      endpoint === "chat" &&
      body &&
      typeof body === "object" &&
      "action" in body &&
      body.action === "resume"
    ) {
      if (Object.keys(body).length !== 1)
        throw new FlowError("INVALID_REQUEST", "Invalid session request.");
      return json({ session: service.resume(token) });
    }
    return json({ session: await service.mutate(token, endpoint, body) });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function handleDetails(
  request: Request,
  id: string,
  service = conversationService,
  control: ControlLedger | undefined = service === conversationService
    ? controlLedger
    : undefined,
) {
  try {
    localRequestGuard(request);
    control?.require(tokenFrom(request));
    return json({ program: service.details(tokenFrom(request), id) });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function handleDelete(
  request: Request,
  service = conversationService,
  control: ControlLedger | undefined = service === conversationService
    ? controlLedger
    : undefined,
) {
  try {
    localRequestGuard(request);
    service.delete(tokenFrom(request));
    control?.delete(tokenFrom(request));
    const response = json({ deleted: true });
    cookie(response, request, "", 0);
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}

const redeemSchema = z.strictObject({
  code: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  adult: z.literal(true),
  privacyNoticeAccepted: z.literal(true),
  noticeVersion: z.enum(["synthetic-privacy-1", "synthetic-openai-1"]),
  scenario: scenarioSchema,
});
export async function handleRedeem(
  request: Request,
  service = conversationService,
  control = controlLedger,
) {
  let createdToken: string | null = null;
  try {
    localRequestGuard(request);
    control.rate("redeem-global", 20);
    const parsed = redeemSchema.safeParse(await readBody(request));
    if (!parsed.success || parsed.data.noticeVersion !== service.noticeVersion)
      throw new FlowError(
        "INVALID_REQUEST",
        "Enter a valid invitation and accept the adult-only privacy notice.",
      );
    let view: ReturnType<ConversationService["resume"]> | undefined;
    const redeemed = control.redeem(parsed.data.code, (token, expires) => {
      createdToken = token;
      view = service.start(
        { action: "start", scenario: parsed.data.scenario },
        null,
        { token, expires },
      ).view;
    });
    const previous = tokenFrom(request);
    if (previous) {
      service.delete(previous);
      control.delete(previous);
    }
    const response = json({ session: view });
    cookie(
      response,
      request,
      redeemed.token,
      Math.max(0, Math.floor((redeemed.expires - Date.now()) / 1000)),
    );
    return response;
  } catch (error) {
    if (createdToken) {
      service.delete(createdToken);
      control.delete(createdToken);
    }
    return errorResponse(error);
  }
}
export function handlePolicy() {
  try {
    return json({ policy: { ...securityPolicy, ...localAiPolicy() } });
  } catch {
    return json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "The local configuration needs review.",
        },
      },
      503,
    );
  }
}
export function handleUpload(request: Request) {
  try {
    localRequestGuard(request);
    throw new FlowError(
      "INVALID_REQUEST",
      "Real PDF upload is disabled. Use fictional text only.",
      403,
    );
  } catch (error) {
    return errorResponse(error);
  }
}
