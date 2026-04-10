import { ExercisePerformance, WorkoutSession } from "../domain/types";

export interface WorkoutLogInput {
  id?: string;
  dayId: string;
  performedAt: string;
  exercises: ExercisePerformance[];
}

let nextSessionNumber = 1;

export function logWorkout(input: WorkoutLogInput): WorkoutSession {
  return {
    id: input.id ?? `session-${nextSessionNumber++}`,
    dayId: input.dayId,
    performedAt: input.performedAt,
    exercises: input.exercises
  };
}

export function getNextSessionId(sessions: WorkoutSession[]): string {
  const highestId = sessions.reduce((highest, session) => {
    const match = /^session-(\d+)$/.exec(session.id);
    const sessionNumber = match ? Number(match[1]) : 0;

    return Math.max(highest, sessionNumber);
  }, 0);

  return `session-${highestId + 1}`;
}

export function findLatestExercisePerformance(
  sessions: WorkoutSession[],
  exerciseId: string
): ExercisePerformance | undefined {
  for (let index = sessions.length - 1; index >= 0; index -= 1) {
    const performance = sessions[index].exercises.find((entry) => entry.exerciseId === exerciseId);

    if (performance) {
      return performance;
    }
  }

  return undefined;
}
