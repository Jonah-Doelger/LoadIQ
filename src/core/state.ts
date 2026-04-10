import { TrainingProgram, TrainingState, WorkoutSession } from "../domain/types";

export function createTrainingState(
  program: TrainingProgram,
  history: WorkoutSession[] = []
): TrainingState {
  return {
    program,
    history
  };
}

export function addWorkoutToState(
  state: TrainingState,
  session: WorkoutSession
): TrainingState {
  return {
    ...state,
    history: [...state.history, session]
  };
}
