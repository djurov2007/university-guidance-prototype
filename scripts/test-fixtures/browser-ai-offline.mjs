// Offline child server only. Never imported by the product or live runner.
// Deny all non-loopback HTTP and replace exactly the expected synthetic API call.
const nativeFetch = globalThis.fetch;
let calls = 0;
const expectedMessage =
  "I want to study computer science. My annual tuition budget is 9000 EUR.";
globalThis.fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string" || input instanceof URL ? input : input.url,
  );
  if (url.href === "https://api.openai.com/v1/responses") {
    if (++calls !== 1)
      throw new Error("Offline transport allows only one synthetic call.");
    const body = JSON.parse(String(init?.body));
    const context = JSON.parse(body.input[0].content[0].text);
    if (
      context.message !== expectedMessage ||
      context.task !== "interpret_message" ||
      body.model !== "gpt-6-luna"
    )
      throw new Error("Unexpected offline synthetic request.");
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
                text: JSON.stringify({
                  type: "answer",
                  answerKey: "profile_review",
                  questionId: null,
                  selections: [],
                  permissionRequestIds: [],
                  proposals: [
                    {
                      field: "fieldOfStudy",
                      valueJson: '"computer science"',
                      quote: "computer science",
                    },
                    { field: "budgetAmount", valueJson: "9000", quote: "9000" },
                    {
                      field: "budgetCurrency",
                      valueJson: '"EUR"',
                      quote: "EUR",
                    },
                    {
                      field: "budgetPeriod",
                      valueJson: '"year"',
                      quote: "annual",
                    },
                  ],
                }),
              },
            ],
          },
        ],
        usage: {
          input_tokens: 1000,
          input_tokens_details: { cached_tokens: 100 },
          output_tokens: 100,
        },
      },
      { headers: { "x-request-id": "req_offline_browser" } },
    );
  }
  if (!["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))
    throw new Error(
      "External HTTP is disabled during offline browser rehearsal.",
    );
  return nativeFetch(input, init);
};
