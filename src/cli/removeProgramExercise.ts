import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { removeExerciseFromDay } from "../core/programEditor";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

interface RemoveProgramExerciseOptions {
  dayId: string;
  id: string;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseRemoveProgramExerciseOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const program = removeExerciseFromDay(state, options.dayId, options.id);

  saveTrainingState({
    ...state,
    program
  });

  console.log(`Removed exercise "${options.id}" from "${options.dayId}".`);
}

export function parseRemoveProgramExerciseOptions(args: string[]): RemoveProgramExerciseOptions {
  const dayId = readFlag(args, "--day");
  const id = readFlag(args, "--id");

  if (!dayId || !id) {
    throw new Error("Both --day and --id are required.");
  }

  return { dayId, id };
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printHelp(): void {
  console.log("Remove an exercise from the saved program.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/removeProgramExercise.js --day upper-b --id incline-dumbbell-press");
}

if (require.main === module) {
  main();
}
