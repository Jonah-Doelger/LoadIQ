import { buildLastSevenDayRange, calculateMuscleGroupVolume } from "../analytics/volume";
import { createStarterProgram } from "../core/program";
import { createTrainingState } from "../core/state";
import { loadTrainingState } from "../storage/jsonStore";

interface ShowVolumeOptions {
  start?: string;
  end?: string;
}

export function main(): void {
  const args = process.argv.slice(2);

  if (args.includes("--help")) {
    printHelp();
    return;
  }

  const options = parseShowVolumeOptions(args);
  const state = loadTrainingState() ?? createTrainingState(createStarterProgram());
  const range = buildRangeFromOptions(options.start, options.end) ?? buildLastSevenDayRange(state.history);
  const volumes = calculateMuscleGroupVolume(state.program, state.history, range);

  if (range) {
    console.log(
      `Volume window: ${formatDate(range.start)} to ${formatDate(range.end)}`
    );
  } else {
    console.log("Volume window: no saved sessions yet");
  }

  if (volumes.length === 0) {
    console.log("No completed training volume found for that window.");
    return;
  }

  for (const volume of volumes) {
    console.log(
      `- ${volume.muscleGroup}: ${volume.completedSets} sets, ${volume.completedReps} reps, ${volume.totalLoad} lb total load`
    );
  }
}

export function parseShowVolumeOptions(args: string[]): ShowVolumeOptions {
  return {
    start: readFlag(args, "--start"),
    end: readFlag(args, "--end")
  };
}

export function buildRangeFromOptions(start?: string, end?: string): { start: Date; end: Date } | undefined {
  if (!start && !end) {
    return undefined;
  }

  if (!start || !end) {
    throw new Error("Provide both --start and --end, or omit both.");
  }

  const parsedStart = new Date(`${start}T00:00:00`);
  const parsedEnd = new Date(`${end}T23:59:59.999`);

  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    throw new Error("Dates must use YYYY-MM-DD format.");
  }

  if (parsedStart > parsedEnd) {
    throw new Error("--start must be before or equal to --end.");
  }

  return {
    start: parsedStart,
    end: parsedEnd
  };
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);

  if (index === -1) {
    return undefined;
  }

  return args[index + 1];
}

function printHelp(): void {
  console.log("Show muscle-group volume from the saved training state.");
  console.log("");
  console.log("Usage:");
  console.log("  node dist/cli/showVolume.js");
  console.log("  node dist/cli/showVolume.js --start 2026-04-05 --end 2026-04-11");
}

if (require.main === module) {
  main();
}
