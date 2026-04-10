import { readFileSync } from "node:fs";
import { parseProgramText } from "../importers/programText";
import { createTrainingState } from "../core/state";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";
import { validateTrainingState } from "../validation/state";

interface ImportProgramOptions {
  file: string;
  resetHistory: boolean;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    printHelp();
    return;
  }

  const options = parseImportProgramOptions(args);
  const contents = readFileSync(options.file, "utf8");
  const importedProgram = parseProgramText(contents);
  const existingState = loadTrainingState();
  const nextState = createTrainingState(
    importedProgram,
    options.resetHistory ? [] : existingState?.history ?? []
  );
  const validation = validateTrainingState(nextState);

  if (!validation.isValid) {
    const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");

    throw new Error(
      `${options.resetHistory ? "Imported program is invalid." : "Imported program conflicts with existing history."}\n${details}`
    );
  }

  saveTrainingState(nextState);

  console.log(`Imported program "${importedProgram.name}".`);
  console.log(`- Workout days: ${importedProgram.days.length}`);
  console.log(`- Sessions per week: ${importedProgram.sessionsPerWeek}`);
  console.log(`- History preserved: ${options.resetHistory ? "no" : "yes"}`);
}

export function parseImportProgramOptions(args: string[]): ImportProgramOptions {
  const file = readFlag(args, "--file");
  const resetHistory = args.includes("--reset-history");

  if (!file) {
    throw new Error("--file is required.");
  }

  return {
    file,
    resetHistory
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
  console.log("Import a structured training program from a text file.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/importProgram.js --file .\\program.txt");
  console.log("  node dist/cli/importProgram.js --file .\\program.txt --reset-history");
}

if (require.main === module) {
  main();
}
