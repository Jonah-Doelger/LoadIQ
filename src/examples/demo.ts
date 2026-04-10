import { getNextSessionId, logWorkout } from "../core/logger";
import { buildNextWorkout } from "../core/planner";
import { createStarterProgram } from "../core/program";
import { addWorkoutToState, createTrainingState } from "../core/state";
import { loadTrainingState, saveTrainingState } from "../storage/jsonStore";

const existingState = loadTrainingState();
let state = existingState ?? createTrainingState(createStarterProgram());

if (state.history.length === 0) {
  state = addWorkoutToState(
    state,
    logWorkout({
      id: getNextSessionId(state.history),
      dayId: "upper-a",
      performedAt: "2026-04-09T18:00:00-05:00",
      exercises: [
        {
          exerciseId: "bench-press",
          sets: [
            { reps: 8, load: 135, completed: true },
            { reps: 8, load: 135, completed: true },
            { reps: 8, load: 135, completed: true }
          ]
        },
        {
          exerciseId: "barbell-row",
          sets: [
            { reps: 8, load: 115, completed: true },
            { reps: 8, load: 115, completed: true },
            { reps: 8, load: 115, completed: true }
          ]
        },
        {
          exerciseId: "overhead-press",
          sets: [
            { reps: 5, load: 65, completed: true },
            { reps: 5, load: 65, completed: true },
            { reps: 4, load: 65, completed: false }
          ]
        }
      ]
    })
  );
  saveTrainingState(state);
}

const nextUpperDay = buildNextWorkout(state.program, "upper-a", state.history);

console.log(`Program: ${state.program.name}`);
console.log(`Saved sessions: ${state.history.length}`);
console.log("Next Upper A targets:");

for (const target of nextUpperDay) {
  console.log(
    `- ${target.exerciseName}: ${target.sets.length} x ${target.sets[0].reps} @ ${target.sets[0].load} lb`
  );
  console.log(`  ${target.rationale}`);
}
