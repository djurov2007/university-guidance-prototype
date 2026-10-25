import {
  profileConversations,
  replayConversation,
} from "../src/test-fixtures/profile-conversations.ts";
const args = process.argv.slice(2);
if (
  args.length > 1 ||
  (args.length && !profileConversations.some((f) => f.id === args[0]))
) {
  console.error(
    "Usage: npm run profile:demo -- [PROFILE-ID]. Available: " +
      profileConversations.map((f) => f.id).join(", "),
  );
  process.exitCode = 1;
} else {
  for (const fixture of profileConversations.filter(
    (f) => !args.length || f.id === args[0],
  )) {
    const result = replayConversation(fixture);
    const final = result.trace.at(-1).turn;
    if (final.status !== fixture.expected)
      throw new Error(`Unexpected status: ${fixture.id}`);
    console.log(
      JSON.stringify(
        {
          id: fixture.id,
          synthetic: true,
          adult: true,
          expected: fixture.expected,
          actual: final.status,
          trace: result.trace.map(({ message, turn, events }) => ({
            message,
            events,
            status: turn.status,
            questions: turn.questions.map(
              ({ id, field, prompt, reason, proposals, candidates }) => ({
                id,
                field,
                prompt,
                reason,
                proposals,
                candidates,
              }),
            ),
            readiness: turn.readiness,
            explanation: turn.explanation,
          })),
          finalProfile: result.state,
        },
        null,
        2,
      ),
    );
  }
}
