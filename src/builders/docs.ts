export function buildDocs(flowTitle: string, messages: { role: string; text: string }[]) {
  const content = [
    `# ${flowTitle}`,
    `## Summary`,
    `- Messages: ${messages.length}`,
    `- Roles: ${[...new Set(messages.map(m => m.role))].join(", ")}`,
    `## Key Points`,
    ...messages.slice(0, 10).map(msg => `- **${msg.role.toUpperCase()}**: ${msg.text.split("\n")[0]?.slice(0, 120) || ""}`)
  ].join("\n");

  return { path: "docs/overview.md", kind: "doc" as const, content };
}
