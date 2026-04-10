import { createStarterProgram } from "../core/program";
import { addWorkoutDay } from "../core/programEditor";
import { createTrainingState } from "../core/state";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

interface AddProgramDayOptions {
  id: string;
  name: string;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseAddProgramDayOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const program = addWorkoutDay(state.program, options);

  saveTrainingState({
    ...state,
    program
  });

  console.log(`Added workout day "${options.id}" (${options.name}).`);
}

export function parseAddProgramDayOptions(args: string[]): AddProgramDayOptions {
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
  console.log("Add a workout day to the saved program.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/addProgramDay.js --id pull-b --name \"Pull B\"");
}

if (require.main === module) {
  main();
}
