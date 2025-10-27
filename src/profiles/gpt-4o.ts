export const profile = {
  name: "gpt-4o",
  style: { prefers: "JSON", systemKey: "instructions", safety: "inline" },
  compile(input: { system: string; user: string }) {
    return {
      model: "gpt-4o",
      input: {
        instructions: input.system,
        messages: [{ role: "user", content: input.user }]
      }
    };
  }
};
