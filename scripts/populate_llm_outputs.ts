import fs from "fs";
import path from "path";
import { spawn, spawnSync } from "child_process";

type RunResult = {
  code: number | null;
  stdout: string;
  stderr: string;
};

const root = process.cwd();
const outputsRoot = path.join(root, "agents", "outputs");
const logRoot = path.join(root, "logs", "llm");
const promptsRoot = path.join(root, "agents", "prompts");

const promptFiles = {
  execution: path.join(promptsRoot, "04-execution.md"),
  drift: path.join(promptsRoot, "05-drift-guardian.md")
};

const context = (() => {
  const system = fs.readFileSync(path.join(root, "agents", "claude.md"), "utf8").trim();
  const roles = fs.readFileSync(path.join(root, "agents", "agents.md"), "utf8").trim();
  return `${system}\n\n${roles}`;
})();

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function commandExists(cmd: string) {
  const res = spawnSync("command", ["-v", cmd], { shell: true, stdio: "ignore" });
  return res.status === 0;
}

function readPrompt(file: string) {
  return fs.readFileSync(file, "utf8").trim();
}

function combinePrompt(promptFile: string) {
  const prompt = readPrompt(promptFile);
  return `${context}\n\n${prompt}`.trim();
}

function runCommand(
  command: string,
  args: string[],
  options: { input?: string; stdoutFile?: string; stderrFile?: string; timeoutMs?: number } = {}
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env: process.env, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timeout =
      options.timeoutMs && options.timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");
          }, options.timeoutMs)
        : undefined;

    child.stdout.on("data", chunk => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", chunk => {
      stderr += chunk.toString();
    });

    child.on("error", err => {
      if (timeout) clearTimeout(timeout);
      reject(err);
    });

    child.on("close", code => {
      if (timeout) clearTimeout(timeout);
      if (options.stdoutFile) {
        ensureDir(path.dirname(options.stdoutFile));
        fs.writeFileSync(options.stdoutFile, stdout, "utf8");
      }
      if (options.stderrFile) {
        ensureDir(path.dirname(options.stderrFile));
        fs.writeFileSync(options.stderrFile, stderr, "utf8");
      }
      if (timedOut) {
        const err = new Error(`${command} timed out`);
        // @ts-ignore
        err.code = "ETIMEDOUT";
        reject(err);
        return;
      }
      resolve({ code, stdout, stderr });
    });

    if (options.input) {
      child.stdin.write(options.input);
    }
    child.stdin.end();
  });
}

async function runClaude(outDir: string) {
  if (!commandExists("claude")) {
    console.log("⚠️  Skipping Claude (CLI not found)");
    return;
  }
  const promptExec = readPrompt(promptFiles.execution);
  const promptDrift = readPrompt(promptFiles.drift);

  const baseArgs = ["--print", "--output-format", "text", "--system-prompt", context];

  const execLog = path.join(logRoot, "claude-execution.log");
  const driftLog = path.join(logRoot, "claude-drift.log");

  console.log("▶ Running Claude execution prompt");
  const execResult = await runCommand("claude", baseArgs, {
    input: promptExec,
    stdoutFile: path.join(outDir, "execution.md"),
    stderrFile: execLog
  });
  if (execResult.code !== 0) {
    throw new Error("Claude execution prompt failed. See logs for details.");
  }

  console.log("▶ Running Claude drift guardian prompt");
  const driftResult = await runCommand("claude", baseArgs, {
    input: promptDrift,
    stdoutFile: path.join(outDir, "drift-guardian.md"),
    stderrFile: driftLog
  });
  if (driftResult.code !== 0) {
    throw new Error("Claude drift guardian prompt failed. See logs for details.");
  }
}

async function runCodex(outDir: string) {
  if (!commandExists("codex")) {
    console.log("⚠️  Skipping Codex (CLI not found)");
    return;
  }
  const execCombined = combinePrompt(promptFiles.execution);
  const driftCombined = combinePrompt(promptFiles.drift);

  const execFile = path.join(outDir, "execution.md");
  const driftFile = path.join(outDir, "drift-guardian.md");
  const execLog = path.join(logRoot, "codex-execution.log");
  const driftLog = path.join(logRoot, "codex-drift.log");

  console.log("▶ Running Codex execution prompt");
  const execResult = await runCommand(
    "codex",
    ["exec", "--skip-git-repo-check", "--output-last-message", execFile],
    { input: execCombined, stderrFile: execLog }
  );
  if (execResult.code !== 0) {
    if (!fs.existsSync(execFile)) {
      throw new Error("Codex execution prompt failed and produced no output.");
    }
  } else if (!fs.existsSync(execFile)) {
    fs.writeFileSync(execFile, execResult.stdout, "utf8");
  }

  console.log("▶ Running Codex drift guardian prompt");
  const driftResult = await runCommand(
    "codex",
    ["exec", "--skip-git-repo-check", "--output-last-message", driftFile],
    { input: driftCombined, stderrFile: driftLog }
  );
  if (driftResult.code !== 0) {
    if (!fs.existsSync(driftFile)) {
      throw new Error("Codex drift guardian prompt failed and produced no output.");
    }
  } else if (!fs.existsSync(driftFile)) {
    fs.writeFileSync(driftFile, driftResult.stdout, "utf8");
  }
}

async function runWithRetry(
  attemptFn: () => Promise<RunResult>,
  attempts = 3,
  backoffBase = 1500
): Promise<RunResult> {
  let lastError: RunResult | undefined;
  for (let i = 0; i < attempts; i += 1) {
    const result = await attemptFn();
    const combined = `${result.stdout}\n${result.stderr}`;
    if (
      result.code === 0 &&
      !/429/.test(combined) &&
      !/Resource exhausted/i.test(combined) &&
      !/Please try again later/i.test(combined)
    ) {
      return result;
    }
    lastError = result;
    const delay = backoffBase * Math.pow(2, i);
    console.warn(`⚠️  Gemini attempt ${i + 1} failed (code ${result.code}). Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  if (lastError) {
    return lastError;
  }
  throw new Error("Gemini attempts exhausted");
}

async function runGemini(outDir: string) {
  if (!commandExists("gemini")) {
    console.log("⚠️  Skipping Gemini (CLI not found)");
    return;
  }

  const execFile = path.join(outDir, "execution.md");
  const driftFile = path.join(outDir, "drift-guardian.md");
  const execLog = path.join(logRoot, "gemini-execution.log");
  const driftLog = path.join(logRoot, "gemini-drift.log");

  console.log("▶ Running Gemini execution prompt");
  const execResult = await runWithRetry(() =>
    runCommand("gemini", ["--output-format", "text", "-p", combinePrompt(promptFiles.execution)], {
      stderrFile: execLog
    })
  );
  if (execResult.code !== 0) {
    throw new Error("Gemini execution prompt failed. See logs for details.");
  }
  fs.writeFileSync(execFile, execResult.stdout, "utf8");

  console.log("▶ Running Gemini drift guardian prompt");
  const driftResult = await runWithRetry(() =>
    runCommand("gemini", ["--output-format", "text", "-p", combinePrompt(promptFiles.drift)], {
      stderrFile: driftLog
    })
  );
  if (driftResult.code !== 0) {
    throw new Error("Gemini drift guardian prompt failed. See logs for details.");
  }
  fs.writeFileSync(driftFile, driftResult.stdout, "utf8");
}

async function main() {
  ensureDir(outputsRoot);
  ensureDir(logRoot);

  const claudeDir = path.join(outputsRoot, "claude-run");
  const codexDir = path.join(outputsRoot, "codex-run");
  const geminiDir = path.join(outputsRoot, "gemini-run");

  ensureDir(claudeDir);
  ensureDir(codexDir);
  ensureDir(geminiDir);

  const errors: string[] = [];

  try {
    await runClaude(claudeDir);
  } catch (err: any) {
    errors.push(err.message || "Claude run failed");
  }

  try {
    await runCodex(codexDir);
  } catch (err: any) {
    errors.push(err.message || "Codex run failed");
  }

  try {
    await runGemini(geminiDir);
  } catch (err: any) {
    errors.push(err.message || "Gemini run failed");
  }

  if (errors.length) {
    console.error("⚠️  Completed with issues:");
    for (const message of errors) {
      console.error(`  - ${message}`);
    }
    process.exit(1);
  } else {
    console.log("✅ LLM output population complete.");
  }
}

main().catch(err => {
  console.error("❌ LLM population script failed:", err);
  process.exit(1);
});
