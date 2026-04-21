import { spawnSync } from "child_process";

const COMMANDS = ["daily", "monthly", "weekly", "session", "blocks"] as const;
type Command = (typeof COMMANDS)[number];

function resolveCcusage(): { bin: string; leadArgs: string[] } {
  const probe = spawnSync("ccusage", ["--version"], { stdio: "ignore" });
  if (probe.status === 0) return { bin: "ccusage", leadArgs: [] };
  return { bin: "npx", leadArgs: ["ccusage@latest"] };
}

export function runCcusage(command: Command, extraArgs: string[] = []): unknown {
  const { bin, leadArgs } = resolveCcusage();
  // Use spawnSync (no shell) so args are never interpreted as shell tokens
  const result = spawnSync(bin, [...leadArgs, command, "--json", ...extraArgs], {
    timeout: 60_000,
    maxBuffer: 50 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: "1" },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr?.toString() ?? `ccusage exited with code ${result.status}`);
  }
  return JSON.parse(result.stdout.toString());
}
