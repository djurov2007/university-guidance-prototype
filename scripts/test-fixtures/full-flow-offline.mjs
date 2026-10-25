import { fullFlowSelection } from "../../src/test-fixtures/full-conversation.ts";
const nativeFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL ? input : input.url,
  );
  if (url.href === "https://api.openai.com/v1/responses") {
    if (++calls > 5) throw new Error("Offline fixture limit exceeded.");
    const body = JSON.parse(String(init?.body));
    if (body.model !== "gpt-6-luna")
      throw new Error("Unexpected fixture model.");
    const context = JSON.parse(body.input[0].content[0].text);
    return Response.json(
      {
        model: "gpt-6-luna",
        status: "completed",
        output: [
          {
            type: "message",
            role: "assistant",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(fullFlowSelection(context)),
              },
            ],
          },
        ],
        usage: {
          input_tokens: 1000,
          input_tokens_details: { cached_tokens: 100, cache_write_tokens: 200 },
          output_tokens: 100,
        },
      },
      { headers: { "x-request-id": `req_offline_full_${calls}` } },
    );
  }
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
    throw new Error("External HTTP disabled in rehearsal.");
  return nativeFetch(input, init);
};
