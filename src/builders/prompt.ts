export function buildPrompt(flowTitle: string, messages: { role: string; text: string }[]) {
  const instructions = [
    `You are a context-compiler. Task: generate all artefacts required for \"${flowTitle}\".`,
    `Constraints: deterministic output order; no placeholders; gate at 25 steps; JSON logs.`,
    `Inputs: conversation snippets below.`,
    `---`,
    ...messages.map(msg => `[${msg.role.toUpperCase()}] ${msg.text}`)
  ].join("\n");

  return { path: "prompts/flow_compiler.txt", kind: "prompt" as const, content: instructions };
}
