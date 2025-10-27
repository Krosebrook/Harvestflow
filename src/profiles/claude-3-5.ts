export const profile = {
  name: "claude-3-5-sonnet",
  style: { prefers: "XML", systemKey: "system", safety: "preamble" },
  compile(input: { system: string; user: string }) {
    const xml = `<sys>${input.system}</sys>\n<task>${input.user}</task>`;
    return {
      model: "claude-3-5-sonnet",
      input: { system: xml }
    };
  }
};
