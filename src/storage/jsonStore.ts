import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { TrainingState } from "../domain/types";
import { validateTrainingState } from "../validation/state";

export const DEFAULT_DATA_PATH = "data/training-state.json";

export function saveTrainingState(
  state: TrainingState,
  filePath: string = DEFAULT_DATA_PATH
): void {
  ensureParentDirectory(filePath);
  writeFileSync(filePath, JSON.stringify(state, null, 2), "utf8");
}

export function loadTrainingState(filePath: string = DEFAULT_DATA_PATH): TrainingState | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  const contents = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(contents) as TrainingState;
  const validation = validateTrainingState(parsed);

  if (!validation.isValid) {
    const details = validation.issues.map((issue) => `${issue.path}: ${issue.message}`).join("\n");

    throw new Error(`Training state is invalid.\n${details}`);
  }

  return parsed;
}

function ensureParentDirectory(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}
