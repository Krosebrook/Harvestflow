export function buildCode(flowId: string) {
  const code = `export const run = () => console.log("Flow ${flowId}: hello, world");`;
  return { path: "src/runner.ts", kind: "code" as const, content: code };
}
