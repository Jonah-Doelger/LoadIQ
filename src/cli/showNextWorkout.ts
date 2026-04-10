import { buildNextWorkout } from "../core/planner";
import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { loadTrainingState } from "../storage/jsonStore";

interface ShowNextWorkoutOptions {
  dayId: string;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseShowNextWorkoutOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const nextWorkout = buildNextWorkout(state.program, options.dayId, state.history);

  console.log(`Program: ${state.program.name}`);
  console.log(`Saved sessions: ${state.history.length}`);
  console.log(`Next targets for ${options.dayId}:`);

  for (const target of nextWorkout) {
    console.log(
      `- ${target.exerciseName}: ${target.sets.length} x ${target.sets[0].reps} @ ${target.sets[0].load} lb`
    );
    console.log(`  ${target.rationale}`);
  }
}

export function parseShowNextWorkoutOptions(args: string[]): ShowNextWorkoutOptions {
  const dayId = readFlag(args, "--day");

  if (!dayId) {
    throw new Error("Missing required --day value.");
  }

  return { dayId };
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printHelp(): void {
  console.log("Show the next workout targets from the saved training state.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/showNextWorkout.js --day upper-a");
}

if (require.main === module) {
  main();
}
