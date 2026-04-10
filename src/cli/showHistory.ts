import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { loadTrainingState } from "../storage/jsonStore";

interface ShowHistoryOptions {
  limit: number;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    printHelp();
    return;
  }

  const options = parseShowHistoryOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const sessions = [...state.history]
    .sort((left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime())
    .slice(0, options.limit);

  if (sessions.length === 0) {
    console.log("No workout history saved yet.");
    return;
  }

  console.log(`Showing ${sessions.length} session(s):`);

  for (const session of sessions) {
    console.log(`- ${session.id} | ${session.dayId} | ${session.performedAt}`);

    for (const performance of session.exercises) {
      const setSummary = performance.sets
        .map((set) => `${set.reps}x${set.load}${set.completed ? "" : "!"}`)
        .join(", ");

      console.log(`  ${performance.exerciseId}: ${setSummary}`);
    }
  }
}

export function parseShowHistoryOptions(args: string[]): ShowHistoryOptions {
  const rawLimit = readFlag(args, "--limit");
  const limit = rawLimit ? Number(rawLimit) : 10;

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("--limit must be a positive integer.");
  }

  return { limit };
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printHelp(): void {
  console.log("Show saved workout history.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/showHistory.js");
  console.log("  node dist/cli/showHistory.js --limit 5");
}

if (require.main === module) {
  main();
}
