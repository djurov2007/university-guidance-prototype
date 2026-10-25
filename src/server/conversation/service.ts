import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import {
  chatRequestSchema,
  profileRequestSchema,
  recommendationRequestSchema,
  feedbackRequestSchema,
  sessionViewSchema,
  programDetailsSchema,
  type ErrorCode,
  type Scenario,
  type SessionView,
} from "../../features/conversation/schema.ts";
import {
  createProfile,
  type ProfileState,
} from "../../features/profiles/schema.ts";
import { applyProfileEvent } from "../../features/profiles/state.ts";
import {
  advanceConversation,
  assessProfile,
} from "../../features/profiles/engine.ts";
import { activeFields } from "../../features/profiles/questions.ts";
import {
  recommend,
  changeAlternativeConsent,
} from "../../features/matching/engine.ts";
import type {
  MatchingInput,
  MatchingOutput,
  AlternativeConsent,
} from "../../features/matching/schema.ts";
import {
  createEducationAdapter,
  buildAiContext,
  stageAiProposals,
} from "../ai/education-adapter.ts";
import { createEducationMock } from "../ai/education-mock.ts";
import {
  ProviderError,
  providerResponseSchema,
  type AiProvider,
} from "../ai/provider.ts";
import type { AiErrorCode } from "../../features/ai/schema.ts";
import { ControlLedger } from "../security/control.ts";
import { parseAiConfig, type AiConfig } from "../ai/config.ts";
import type { SpendGuard } from "../ai/provider.ts";
import { aiDiagnosticSchema, type AiDiagnostic } from "../ai/diagnostics.ts";
import { exampleAnswers, sessionCatalog } from "./fixtures.ts";
import { readLocalCatalog } from "../catalog/local-repository.ts";

export class FlowError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  constructor(code: ErrorCode, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
type Session = {
  accessToken: string;
  noticeVersion: string;
  revision: number;
  scenario: Scenario;
  expiresAt: number;
  profile: ProfileState;
  messages: SessionView["messages"];
  matching: MatchingOutput | null;
  consents: AlternativeConsent[];
  issue: SessionView["issue"];
  feedback: { kind: string; message: string; programId: string | null }[];
  requests: number[];
};
export type Endpoint = "chat" | "profile" | "recommendations" | "feedback";
const expired = () =>
  new FlowError(
    "SESSION_EXPIRED",
    "This demonstration session has expired. Start a new one.",
    401,
  );
export function mapAiError(code: AiErrorCode): ErrorCode {
  switch (code) {
    case "TIMEOUT":
      return "PROVIDER_TIMEOUT";
    case "RATE_LIMIT":
      return "RATE_LIMITED";
    case "INVALID_OUTPUT":
    case "INCOMPLETE_RESPONSE":
      return "MODEL_INVALID_OUTPUT";
    case "MODEL_REFUSAL":
      return "MODEL_REFUSAL";
    case "BUDGET_EXCEEDED":
      return "BUDGET_EXCEEDED";
    case "PROVIDER_UNAVAILABLE":
      return "PROVIDER_UNAVAILABLE";
    case "UNSAFE_REQUEST":
      return "OUT_OF_SCOPE";
    case "INVALID_REQUEST":
      return "INVALID_REQUEST";
    default:
      return "INTERNAL_ERROR";
  }
}

// Profiles remain process-local; access and quota control use a durable ledger.
export class ConversationService {
  private readonly sessions = new Map<string, Session>();
  private readonly busy = new Set<string>();
  private readonly control: ControlLedger | undefined;
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly providerFactory:
    | ((
        input: MatchingInput,
        scenario: Scenario,
        guard?: SpendGuard,
      ) => AiProvider)
    | undefined;
  private readonly aiConfig: () => AiConfig;
  get noticeVersion() {
    return this.aiConfig().provider === "openai"
      ? "synthetic-openai-1"
      : "synthetic-privacy-1";
  }
  constructor(
    options: {
      control?: ControlLedger;
      now?: () => number;
      ttlMs?: number;
      aiConfig?: () => AiConfig;
      providerFactory?: (
        input: MatchingInput,
        scenario: Scenario,
        guard?: SpendGuard,
      ) => AiProvider;
    } = {},
  ) {
    this.control = options.control;
    const cleanup = setInterval(() => this.prune(), 30000);
    cleanup.unref();
    this.now = options.now ?? Date.now;
    this.ttlMs = options.ttlMs ?? 30 * 60 * 1000;
    this.providerFactory = options.providerFactory;
    this.aiConfig = options.aiConfig ?? (() => parseAiConfig({}));
  }
  private prune(skipControl = false) {
    for (const [key, session] of this.sessions)
      if (session.expiresAt <= this.now()) this.sessions.delete(key);
      else if (this.control && !skipControl) {
        try {
          this.control.require(key);
        } catch {
          this.sessions.delete(key);
        }
      }
  }
  private get(token: string | null): Session {
    this.prune();
    const value = token && this.sessions.get(token);
    if (!value) throw expired();
    return value;
  }
  private input(session: Session): MatchingInput {
    // This local prototype's dated human reviews use the Belgrade calendar.
    // Keep the same calendar at midnight instead of treating today's review
    // as a future fact until UTC catches up. Freshness thresholds are unchanged.
    const asOf = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(this.now());
    return {
      profile: session.profile,
      catalog: sessionCatalog(session.scenario, asOf),
      asOf,
      consents: session.consents,
    };
  }
  private advance(session: Session) {
    session.profile = advanceConversation(session.profile, {
      asOfYear: new Date(this.now()).getUTCFullYear(),
    }).state;
  }
  private say(
    session: Session,
    text: string,
    role: "user" | "assistant" = "assistant",
  ) {
    session.messages.push({ role, text });
    session.messages = session.messages.slice(-20);
  }
  private event(session: Session, event: Record<string, unknown>) {
    const result = applyProfileEvent(session.profile, {
      ...event,
      id: randomUUID(),
      baseRevision: session.profile.revision,
    });
    if (!result.ok)
      throw new FlowError(
        "INVALID_REQUEST",
        "That profile change could not be applied. Review the value and try again.",
      );
    session.profile = result.state;
    session.matching = null;
    session.consents = [];
  }
  private view(session: Session): SessionView {
    const turn = advanceConversation(session.profile, {
      asOfYear: new Date(this.now()).getUTCFullYear(),
    });
    const active = activeFields(session.profile);
    const confirmed = active.every(
      (key) => session.profile.fields[key].status !== "user_stated",
    );
    return sessionViewSchema.parse({
      revision: session.revision,
      profileRevision: session.profile.revision,
      scenario: session.scenario,
      expiresAt: new Date(session.expiresAt).toISOString(),
      mode: session.scenario === "published" ? "published" : "synthetic",
      fields: active.map((key) => {
        const f = session.profile.fields[key];
        return {
          key,
          status: f.status,
          value: f.value,
          proposals: f.proposals.map((p) => ({ id: p.id, value: p.value })),
          candidates: f.candidates.map((c) => c.value),
        };
      }),
      questions: turn.questions.map((q) => ({
        id: q.id,
        field: q.field,
        text: q.prompt,
      })),
      requiredMissing: turn.readiness.requiredMissing,
      ready: turn.readiness.status === "ready_limited" && confirmed,
      messages: session.messages,
      matching: session.matching,
      grants: session.consents
        .filter((c) => c.decision === "granted")
        .map((c) => ({
          requestId: c.requestId,
          message:
            "You allowed this alternative for the current profile and catalogue. You can withdraw permission.",
        })),
      issue: session.issue,
      feedbackCount: session.feedback.length,
    });
  }
  start(
    body: unknown,
    previous: string | null = null,
    access?: { token: string; expires: number },
  ) {
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success || parsed.data.action !== "start")
      throw new FlowError("INVALID_REQUEST", "Choose a valid demonstration.");
    // Redemption owns the transaction; avoid nested ledger reads here.
    this.prune(Boolean(access && !previous));
    if (this.sessions.size >= 50 && !(previous && this.sessions.has(previous)))
      throw new FlowError(
        "RATE_LIMITED",
        "The local demonstration is full. Try again later.",
        429,
      );
    if (previous && this.busy.has(previous))
      throw new FlowError(
        "RATE_LIMITED",
        "Please wait for the current request to finish.",
        429,
      );
    if (previous) this.sessions.delete(previous);
    const token = access?.token ?? randomBytes(32).toString("base64url");
    const session: Session = {
      accessToken: token,
      noticeVersion: this.noticeVersion,
      revision: 0,
      scenario: parsed.data.scenario,
      expiresAt: access?.expires ?? this.now() + this.ttlMs,
      profile: createProfile(),
      messages: [],
      matching: null,
      consents: [],
      issue: null,
      feedback: [],
      requests: [],
    };
    this.advance(session);
    this.say(
      session,
      "Let's build a study profile. Use fictional details only. Review each suggested value before confirming it.",
    );
    this.sessions.set(token, session);
    return { token, view: this.view(session) };
  }
  resume(token: string | null) {
    return this.view(this.get(token));
  }
  delete(token: string | null) {
    if (token) this.sessions.delete(token);
  }
  async mutate(token: string | null, endpoint: Endpoint, body: unknown) {
    const current = this.get(token);
    const schema =
      endpoint === "chat"
        ? chatRequestSchema
        : endpoint === "profile"
          ? profileRequestSchema
          : endpoint === "recommendations"
            ? recommendationRequestSchema
            : feedbackRequestSchema;
    const parsed = schema.safeParse(body);
    if (!parsed.success || !("revision" in parsed.data))
      throw new FlowError(
        "INVALID_REQUEST",
        "Review your request. Messages can contain at most 8,000 characters.",
      );
    if (parsed.data.revision !== current.revision)
      throw new FlowError(
        "PROFILE_CONFLICT",
        "Your profile changed in another request. Refresh before continuing.",
        409,
      );
    if (this.busy.has(token!))
      throw new FlowError(
        "RATE_LIMITED",
        "Please wait for the current request to finish.",
        429,
      );
    const recent = current.requests.filter((t) => this.now() - t < 60000);
    if (recent.length >= 30)
      throw new FlowError(
        "RATE_LIMITED",
        "Please slow down and try again in a minute.",
        429,
      );
    if (
      endpoint === "chat" &&
      "action" in parsed.data &&
      parsed.data.action === "message"
    )
      this.control?.acceptMessage(token!);
    this.busy.add(token!);
    // Failed validation never commits partial profile/consent changes.
    const session = structuredClone(current);
    session.issue = null;
    session.requests = [...recent, this.now()];
    try {
      if (endpoint === "chat")
        await this.message(session, chatRequestSchema.parse(body));
      if (endpoint === "profile")
        this.profile(session, profileRequestSchema.parse(body));
      if (endpoint === "recommendations")
        await this.search(session, recommendationRequestSchema.parse(body));
      if (endpoint === "feedback") {
        const request = feedbackRequestSchema.parse(body);
        if (session.feedback.length >= 10)
          throw new FlowError(
            "RATE_LIMITED",
            "This session has reached its feedback limit.",
            429,
          );
        if (
          request.programId &&
          !session.matching?.options.some(
            (o) => o.programId === request.programId,
          )
        )
          throw new FlowError("INVALID_REQUEST", "Choose a visible programme.");
        session.feedback.push({
          kind: request.kind,
          message: request.message,
          programId: request.programId,
        });
        this.say(
          session,
          "Feedback saved for this local demonstration session only. It will be removed when the session ends.",
        );
      }
      if (
        this.sessions.get(token!) !== current ||
        session.expiresAt <= this.now()
      )
        throw expired();
      this.control?.require(token!);
      session.revision++;
      const result = this.view(session);
      this.sessions.set(token!, session);
      return result;
    } finally {
      this.busy.delete(token!);
    }
  }
  private profile(
    session: Session,
    request: ReturnType<typeof profileRequestSchema.parse>,
  ) {
    if (request.action === "prepare_example") {
      if (session.profile.fields.studyLevel.status !== "missing")
        throw new FlowError(
          "INVALID_REQUEST",
          "Start a new demonstration to load another example.",
        );
      // Fictional example values are proposed, never silently trusted.
      for (const [field, value] of Object.entries(
        exampleAnswers(session.scenario),
      ))
        this.event(session, {
          type: "propose",
          field,
          value,
          origin: "text_extraction",
          sourceRef: "synthetic-example",
        });
      this.say(
        session,
        "These are fictional example details. Review or edit them, then confirm the details you want to use.",
      );
    } else if (request.action === "confirm") {
      const level = session.profile.fields.studyLevel;
      if (level.status === "user_stated" || level.proposals.length)
        this.event(session, {
          type: "confirm",
          field: "studyLevel",
          fieldRevision: level.revision,
          proposalId: level.proposals[0]?.id ?? null,
        });
      for (const field of activeFields(session.profile)) {
        const f = session.profile.fields[field];
        if (f.status === "user_stated" || f.proposals.length)
          this.event(session, {
            type: "confirm",
            field,
            fieldRevision: f.revision,
            proposalId: f.proposals[0]?.id ?? null,
          });
      }
      this.say(
        session,
        "Your reviewed details are confirmed. Any missing qualification, funding or other requirement still needs an answer.",
      );
    } else if (request.action === "resolve") {
      this.event(session, {
        type: "resolve",
        field: request.field,
        value: request.value,
        fieldRevision: session.profile.fields[request.field].revision,
      });
      this.say(
        session,
        "The conflicting answer is resolved. Previous results and alternative permissions have been cleared.",
      );
    } else {
      if (!activeFields(session.profile).includes(request.field))
        throw new FlowError(
          "INVALID_REQUEST",
          "That question does not apply to the current study level.",
        );
      this.event(session, {
        type: "user_answer",
        field: request.field,
        value: request.value,
        mode: request.mode,
      });
      this.say(
        session,
        "Your answer is saved. Confirm your updated details before searching again.",
      );
    }
    this.advance(session);
    if (
      assessProfile(session.profile, {
        asOfYear: new Date(this.now()).getUTCFullYear(),
      }).conflicts.length
    )
      session.issue = {
        code: "PROFILE_CONFLICT",
        message:
          "Your answers disagree. Choose which value to keep before searching.",
      };
  }
  private async ai(
    session: Session,
    task: "interpret_message" | "explain_recommendations",
    message: string,
  ) {
    const input = this.input(session);
    if (session.noticeVersion !== this.noticeVersion)
      throw new FlowError(
        "INVALID_REQUEST",
        "The AI privacy notice has changed. End this session and redeem an invitation after accepting the current notice.",
        403,
      );
    const config = this.aiConfig();
    const diagnostics: AiDiagnostic[] = [];
    const metering = {
      reservedTokens: 0,
      usedTokens: null as number | null,
      costMicros: 0,
    };
    const spendGuard = this.control?.liveSpendGuard(
      session.accessToken,
      metering,
    );
    const provider =
      this.providerFactory?.(input, session.scenario, spendGuard) ??
      (session.scenario === "provider_unavailable"
        ? {
            kind: "mock" as const,
            model: "synthetic-unavailable",
            version: "local-1",
            async generate() {
              throw new ProviderError("PROVIDER_UNAVAILABLE");
            },
          }
        : createEducationMock(buildAiContext(input)));
    const requestId = randomUUID(),
      started = Date.now();
    let hold: string | null = null;
    let usedTokens: number | null = null;
    let reservedTokens = 0;
    const guarded: AiProvider = {
      kind: provider.kind,
      model: provider.model,
      version: provider.version,
      generate: async (request, signal) => {
        // OpenAI owns the single combined reservation before its HTTP call.
        if (provider.kind === "openai")
          return provider.generate(request, signal);
        reservedTokens =
          Buffer.byteLength(
            request.contextJson + request.instructions,
            "utf8",
          ) +
          1024 +
          request.maxOutputTokens;
        hold =
          this.control?.reserve(session.accessToken, reservedTokens) ?? null;
        const response = providerResponseSchema.parse(
          await provider.generate(request, signal),
        );
        if (response.usage) {
          usedTokens = response.usage.inputTokens + response.usage.outputTokens;
          if (
            usedTokens > reservedTokens ||
            response.usage.outputTokens > request.maxOutputTokens
          ) {
            usedTokens = null;
            throw new ProviderError("INVALID_OUTPUT");
          }
        }
        return response;
      },
    };
    try {
      const output = await createEducationAdapter({
        input,
        provider: guarded,
        config: provider.kind === "openai" ? config : parseAiConfig({}),
        onDiagnostic: (event) => {
          const safe = aiDiagnosticSchema.safeParse(event);
          if (safe.success && diagnostics.length < 4)
            diagnostics.push(safe.data);
        },
      }).run({
        requestId,
        profileRevision: session.profile.revision,
        task,
        message,
      });
      this.control?.log(session.accessToken, {
        requestId,
        task,
        model: provider.model,
        returnedModel: output.metadata.returnedModel,
        durationMs: Date.now() - started,
        tokens:
          provider.kind === "openai"
            ? (metering.usedTokens ?? metering.reservedTokens)
            : (usedTokens ?? reservedTokens),
        usageKnown:
          provider.kind === "openai"
            ? metering.usedTokens !== null
            : usedTokens !== null,
        usage: output.metadata.usage,
        estimatedCostMicros: metering.costMicros,
        providerRequestIds: output.metadata.providerRequestIds,
        pricingVersion: output.metadata.pricingVersion,
        diagnostics,
        errorCode: output.error?.code ?? null,
        instructionVersion: output.metadata.instructionVersion,
      });
      return output;
    } finally {
      if (hold) this.control?.settle(hold, usedTokens, 0);
    }
  }

  private async message(
    session: Session,
    request: ReturnType<typeof chatRequestSchema.parse>,
  ) {
    if (request.action !== "message")
      throw new FlowError("INVALID_REQUEST", "Invalid message action.");
    const output = await this.ai(session, "interpret_message", request.message);
    // Screening precedes even deterministic extraction; raw unsafe messages are not retained.
    if (output.type === "out_of_scope" || output.error) {
      session.issue = {
        code: output.error ? mapAiError(output.error.code) : "OUT_OF_SCOPE",
        message: output.message,
      };
      this.say(session, output.message);
      return;
    }
    this.say(session, request.message, "user");
    const budget = /^my budget is (\d{1,8}) EUR[.!]?$/i.exec(request.message);
    if (budget) {
      this.event(session, {
        type: "user_answer",
        field: "budgetAmount",
        value: Number(budget[1]),
        mode: "assert",
      });
      this.event(session, {
        type: "user_answer",
        field: "budgetCurrency",
        value: "EUR",
        mode: "assert",
      });
      this.advance(session);
      const conflict =
        session.profile.fields.budgetAmount.status === "conflicting" ||
        session.profile.fields.budgetCurrency.status === "conflicting";
      session.issue = conflict
        ? {
            code: "PROFILE_CONFLICT",
            message:
              "This budget or currency differs from your earlier answer. Choose the value to keep.",
          }
        : null;
      this.say(
        session,
        conflict
          ? session.issue!.message
          : "Review and confirm the stated budget amount and EUR currency. Period and living costs remain separate answers.",
      );
    } else {
      const staged = stageAiProposals(session.profile, output);
      if (!staged.ok)
        throw new FlowError(
          "MODEL_INVALID_OUTPUT",
          "The suggested changes could not be verified.",
        );
      session.profile = staged.state;
      if (output.proposals.length) {
        session.matching = null;
        session.consents = [];
        this.advance(session);
      }
      this.say(session, output.message);
    }
  }
  private async search(
    session: Session,
    request: ReturnType<typeof recommendationRequestSchema.parse>,
  ) {
    if (!this.view(session).ready) {
      session.issue = {
        code: assessProfile(session.profile, {
          asOfYear: new Date(this.now()).getUTCFullYear(),
        }).conflicts.length
          ? "PROFILE_CONFLICT"
          : "NEEDS_INFORMATION",
        message:
          "Answer the remaining questions and confirm your details before searching.",
      };
      session.matching = null;
      this.say(session, session.issue.message);
      return;
    }
    if (request.action === "consent") {
      try {
        session.consents = changeAlternativeConsent(
          this.input(session),
          request.requestId,
          request.decision,
        );
      } catch {
        throw new FlowError(
          "INVALID_REQUEST",
          "This permission no longer applies. Search again with your current profile.",
        );
      }
    }
    const matching = recommend(this.input(session));
    // Searching without an explanation is a visible user action, never a silent fallback.
    if (request.action === "search" && request.explain) {
      const output = await this.ai(
        session,
        "explain_recommendations",
        "Explain these recommendations",
      );
      if (output.error || !output.matching) {
        session.matching = null;
        session.issue = {
          code: output.error
            ? mapAiError(output.error.code)
            : "MODEL_INVALID_OUTPUT",
          message: output.message,
        };
        this.say(session, output.message);
        return;
      }
      session.matching = output.matching;
      this.say(session, output.message);
    } else {
      session.matching = matching;
      this.say(session, matching.message);
    }
    if (matching.status === "no_match" || matching.status === "catalog_empty")
      session.issue = {
        code: "NO_CATALOG_MATCH",
        message:
          matching.status === "catalog_empty"
            ? "The reviewed published catalogue is empty. No real programmes can be recommended yet."
            : "No programme in this limited catalogue matches your requirements. You can explicitly change your preferences or start a new search.",
      };
    else if (matching.status === "needs_verification")
      session.issue = {
        code: "SOURCE_UNVERIFIED",
        message:
          "Important conditions remain unknown. These are options to investigate, with no promise of funding or admission.",
      };
  }
  details(token: string | null, id: string) {
    const session = this.get(token);
    const input = this.input(session);
    const option = session.matching?.options.find((o) => o.programId === id);
    // Recompute permission/time-sensitive visibility before exposing sources or identity.
    if (
      !option ||
      !recommend(input).options.some((o) => o.programId === id) ||
      !["synthetic", "published"].includes(input.catalog.channel)
    )
      throw new FlowError(
        "NO_CATALOG_MATCH",
        "This programme is not available in your current results.",
        404,
      );
    const program = input.catalog.programs.find((p) => p.id === id)!;
    if (session.scenario === "published") {
      const catalog = readLocalCatalog("published", input.asOf).catalog!;
      const facts = catalog.facts.filter(
        (f) =>
          f.programId === id &&
          (f.intakeId === null || f.intakeId === program.intakeId),
      );
      return programDetailsSchema.parse({
        programId: id,
        name: option.name,
        synthetic: false,
        sources: catalog.sources
          .filter(
            (source) =>
              source.authority === "official" &&
              source.programIds.includes(id) &&
              catalog.evidence.some(
                (e) =>
                  e.sourceId === source.id &&
                  facts.some((f) => f.id === e.factId),
              ),
          )
          .map((source) => ({
            id: source.id,
            factIds: [
              ...new Set(
                catalog.evidence
                  .filter(
                    (e) =>
                      e.sourceId === source.id &&
                      facts.some((f) => f.id === e.factId),
                  )
                  .map((e) => e.factId),
              ),
            ],
            label: source.title,
            checkedOn: source.checkedOn,
            note: "Official institutional source reviewed for this programme and intake. Individual eligibility, fee category and funding still require verification.",
            url: source.url,
          })),
        unknowns: [
          ...new Set([
            ...facts
              .filter((f) => f.status === "unknown")
              .map((f) => f.unknownReason!),
            ...option.warnings,
            ...option.checks
              .filter((c) => ["unknown", "source_conflict"].includes(c.status))
              .map((c) => c.message),
          ]),
        ],
        nextStep:
          "Check the official sources and ask the institution to assess your exact qualification, fee category, English/mathematics evidence and selection requirements before applying. No admission or funding is guaranteed.",
      });
    }
    const proofs = [
      program.identityProof,
      program.languageProof,
      program.costProof,
      program.fundingProof,
      ...program.rules.map((r) => r.proof),
    ];
    return programDetailsSchema.parse({
      programId: id,
      name: option.name,
      synthetic: true,
      sources: [
        ...new Set([
          ...option.reasons.flatMap((r) => r.sourceIds),
          ...option.checks.flatMap((c) => c.sourceIds),
        ]),
      ].map((source) => ({
        id: source,
        factIds: [
          ...new Set(
            proofs
              .filter((p) => p.sourceIds.includes(source))
              .flatMap((p) => p.factIds),
          ),
        ],
        label: "Fictional demonstration evidence",
        checkedOn: proofs[0]!.checkedOn,
        note: "Synthetic data only. This is not an official university source and has no real URL or human review.",
        url: null,
      })),
      unknowns: [
        ...option.warnings,
        ...option.checks
          .filter((c) => ["unknown", "source_conflict"].includes(c.status))
          .map((c) => c.message),
      ],
      nextStep:
        "For a real application, verify the exact intake and applicant conditions with the institution. This fictional example cannot be used to apply.",
    });
  }
}
