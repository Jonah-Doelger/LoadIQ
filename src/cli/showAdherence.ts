import { buildAdherenceRange, buildAdherenceSummary } from "../analytics/adherence";
import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { loadTrainingState } from "../storage/jsonStore";

interface ShowAdherenceOptions {
  start?: string;
  end?: string;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    printHelp();
    return;
  }

  const options = parseShowAdherenceOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const range = buildAdherenceRange(options.start, options.end);
  const summary = buildAdherenceSummary(state.program, state.history, range);

  if (!summary) {
    console.log("No adherence data available yet.");
    return;
  }

  console.log(`Adherence window: ${summary.windowStart} to ${summary.windowEnd}`);
  console.log(`Completed sessions: ${summary.completedSessions} / ${summary.targetSessions}`);
  console.log(`Adherence rate: ${summary.adherenceRate}%`);
  console.log(`Missed sessions: ${summary.missedSessions}`);
  console.log(`Workout day coverage: ${summary.completedWorkoutDays} / ${summary.availableWorkoutDays}`);
}

export function parseShowAdherenceOptions(args: string[]): ShowAdherenceOptions {
  return {
    start: readFlag(args, "--start"),
    end: readFlag(args, "--end")
  };
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printHelp(): void {
  console.log("Show program adherence from saved training history.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/showAdherence.js");
  console.log("  node dist/cli/showAdherence.js --start 2026-04-05 --end 2026-04-11");
}

if (require.main === module) {
  main();
}
