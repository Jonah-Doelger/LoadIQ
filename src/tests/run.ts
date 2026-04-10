import { runAdherenceTests } from "./adherence.test";
import { runAddProgramDayTests } from "./addProgramDay.test";
import { runAddProgramExerciseTests } from "./addProgramExercise.test";
import { runCliTests } from "./cli.test";
import { runLoggerTests } from "./logger.test";
import { runPlannerTests } from "./planner.test";
import { runPersonalRecordTests } from "./personalRecords.test";
import { runProgramEditorTests } from "./programEditor.test";
import { runProgramImportTests } from "./programImport.test";
import { runProgressionTests } from "./progression.test";
import { runRemoveProgramDayTests } from "./removeProgramDay.test";
import { runRemoveProgramExerciseTests } from "./removeProgramExercise.test";
import { runImportProgramCliTests } from "./importProgramCli.test";
import { runShowAdherenceTests } from "./showAdherence.test";
import { runShowHistoryTests } from "./showHistory.test";
import { runShowNextWorkoutTests } from "./showNextWorkout.test";
import { runShowVolumeTests } from "./showVolume.test";
import { runStorageTests } from "./storage.test";
import { runTrendTests } from "./trends.test";
import { runUpdateProgramDayTests } from "./updateProgramDay.test";
import { runUpdateProgramExerciseTests } from "./updateProgramExercise.test";
import { runUpdateProgramTests } from "./updateProgram.test";
import { runValidationTests } from "./validation.test";
import { runVolumeTests } from "./volume.test";

function runTestSuite(name: string, runner: () => void): void {
  try {
    runner();
    console.log(`[pass] ${name}`);
  } catch (error) {
    console.error(`[fail] ${name}`);
    throw error;
  }
}

runTestSuite("adherence", runAdherenceTests);
runTestSuite("add-program-day", runAddProgramDayTests);
runTestSuite("add-program-exercise", runAddProgramExerciseTests);
runTestSuite("cli", runCliTests);
runTestSuite("logger", runLoggerTests);
runTestSuite("progression", runProgressionTests);
runTestSuite("planner", runPlannerTests);
runTestSuite("import-program-cli", runImportProgramCliTests);
runTestSuite("personal-records", runPersonalRecordTests);
runTestSuite("program-editor", runProgramEditorTests);
runTestSuite("program-import", runProgramImportTests);
runTestSuite("remove-program-day", runRemoveProgramDayTests);
runTestSuite("remove-program-exercise", runRemoveProgramExerciseTests);
runTestSuite("show-adherence", runShowAdherenceTests);
runTestSuite("show-history", runShowHistoryTests);
runTestSuite("show-next-workout", runShowNextWorkoutTests);
runTestSuite("show-volume", runShowVolumeTests);
runTestSuite("storage", runStorageTests);
runTestSuite("trends", runTrendTests);
runTestSuite("update-program-day", runUpdateProgramDayTests);
runTestSuite("update-program-exercise", runUpdateProgramExerciseTests);
runTestSuite("update-program", runUpdateProgramTests);
runTestSuite("validation", runValidationTests);
runTestSuite("volume", runVolumeTests);
