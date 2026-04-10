import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { removeWorkoutDay } from "../core/programEditor";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

interface RemoveProgramDayOptions {
  id: string;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseRemoveProgramDayOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const program = removeWorkoutDay(state, options.id);

  saveTrainingState({
    ...state,
    program
  });

  console.log(`Removed workout day "${options.id}".`);
}

export function parseRemoveProgramDayOptions(args: string[]): RemoveProgramDayOptions {
  const id = readFlag(args, "--id");

  if (!id) {
    throw new Error("--id is required.");
  }

  return { id };
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printHelp(): void {
  console.log("Remove a workout day from the saved program.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/removeProgramDay.js --id upper-b");
}

if (require.main === module) {
  main();
}
