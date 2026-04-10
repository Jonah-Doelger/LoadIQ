import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { updateWorkoutDay } from "../core/programEditor";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

interface UpdateProgramDayOptions {
  id: string;
  name: string;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseUpdateProgramDayOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const program = updateWorkoutDay(state.program, {
    dayId: options.id,
    name: options.name
  });

  saveTrainingState({
    ...state,
    program
  });

  console.log(`Updated workout day "${options.id}" to "${options.name}".`);
}

export function parseUpdateProgramDayOptions(args: string[]): UpdateProgramDayOptions {
  const id = readFlag(args, "--id");
  const name = readFlag(args, "--name");

  if (!id || !name) {
    throw new Error("Both --id and --name are required.");
  }

  return { id, name };
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printHelp(): void {
  console.log("Update a saved workout day.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/updateProgramDay.js --id upper-a --name \"Upper Strength\"");
}

if (require.main === module) {
  main();
}
