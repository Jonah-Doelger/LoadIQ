import { updateProgram } from "../core/programEditor";
import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

interface UpdateProgramOptions {
  name?: string;
  split?: string;
  sessionsPerWeek?: number;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseUpdateProgramOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const nextProgram = updateProgram(state.program, options);
  const nextState = {
    ...state,
    program: nextProgram
  };

  saveTrainingState(nextState);

  console.log("Updated program:");
  console.log(`- Name: ${nextProgram.name}`);
  console.log(`- Split: ${nextProgram.split}`);
  console.log(`- Sessions per week: ${nextProgram.sessionsPerWeek}`);
}

export function parseUpdateProgramOptions(args: string[]): UpdateProgramOptions {
  const name = readFlag(args, "--name");
  const split = readFlag(args, "--split");
  const rawSessionsPerWeek = readFlag(args, "--sessions-per-week");
  const sessionsPerWeek =
    rawSessionsPerWeek === undefined ? undefined : Number(rawSessionsPerWeek);

  if (!name && !split && rawSessionsPerWeek === undefined) {
    throw new Error("Provide at least one program field to update.");
  }

  if (rawSessionsPerWeek !== undefined) {
    if (sessionsPerWeek === undefined || !Number.isInteger(sessionsPerWeek) || sessionsPerWeek <= 0) {
      throw new Error("--sessions-per-week must be a positive integer.");
    }
  }

  return {
    name,
    split,
    sessionsPerWeek
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
  console.log("Update saved program metadata.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/updateProgram.js --name \"LoadIQ Base\"");
  console.log("  node dist/cli/updateProgram.js --split \"Push / Pull / Legs\" --sessions-per-week 5");
}

if (require.main === module) {
  main();
}
