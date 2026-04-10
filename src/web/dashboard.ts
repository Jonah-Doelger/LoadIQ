import { buildAdherenceSummary } from "../analytics/adherence";
import { buildPersonalRecords } from "../analytics/personalRecords";
import { buildNextWorkout } from "../core/planner";
import { buildExerciseTrends } from "../analytics/trends";
import { buildLastSevenDayRange, calculateMuscleGroupVolume } from "../analytics/volume";
import { MuscleGroup, TrainingState } from "../domain/types";

export interface HistoryByMuscleGroupEntry {
  muscleGroup: MuscleGroup;
  sessions: Array<{
    sessionId: string;
    dayId: string;
    performedAt: string;
    exercises: Array<{
      exerciseId: string;
      exerciseName: string;
      sets: TrainingState["history"][number]["exercises"][number]["sets"];
    }>;
  }>;
}

export interface DashboardData {
  adherence?: ReturnType<typeof buildAdherenceSummary>;
  ai?: TrainingState["ai"];
  history: TrainingState["history"];
  historyByMuscleGroup: HistoryByMuscleGroupEntry[];
  nextWorkouts: Array<{
    dayId: string;
    dayName: string;
    targets: ReturnType<typeof buildNextWorkout>;
  }>;
  program: TrainingState["program"];
  savedPrograms: NonNullable<TrainingState["savedPrograms"]>;
  records: ReturnType<typeof buildPersonalRecords>;
  trends: ReturnType<typeof buildExerciseTrends>;
  volume: ReturnType<typeof calculateMuscleGroupVolume>;
}

export function buildDashboardData(state: TrainingState): DashboardData {
  const range = buildLastSevenDayRange(state.history);

  return {
    adherence: buildAdherenceSummary(state.program, state.history, range),
    ai: state.ai,
    history: [...state.history].sort(
      (left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime()
    ),
    historyByMuscleGroup: buildHistoryByMuscleGroup(state),
    nextWorkouts: state.program.days.map((day) => ({
      dayId: day.id,
      dayName: day.name,
      targets: buildNextWorkout(state.program, day.id, state.history)
    })),
    program: state.program,
    savedPrograms: state.savedPrograms ?? [],
    records: buildPersonalRecords(state.program, state.history),
    trends: buildExerciseTrends(state.program, state.history),
    volume: calculateMuscleGroupVolume(state.program, state.history, range)
  };
}

function buildHistoryByMuscleGroup(state: TrainingState): HistoryByMuscleGroupEntry[] {
  const exerciseById = new Map(
    state.program.days.flatMap((day) => day.exercises.map((exercise) => [exercise.id, exercise] as const))
  );
  const grouped = new Map<MuscleGroup, HistoryByMuscleGroupEntry["sessions"]>();

  for (const session of [...state.history].sort(
    (left, right) => new Date(right.performedAt).getTime() - new Date(left.performedAt).getTime()
  )) {
    for (const performance of session.exercises) {
      const definition = exerciseById.get(performance.exerciseId);

      if (!definition) {
        continue;
      }

      for (const muscleGroup of definition.muscleGroups) {
        const sessions = grouped.get(muscleGroup) ?? [];
        const existingSession = sessions.find((entry) => entry.sessionId === session.id);

        if (existingSession) {
          existingSession.exercises.push({
            exerciseId: performance.exerciseId,
            exerciseName: definition.name,
            sets: performance.sets
          });
        } else {
          sessions.push({
            sessionId: session.id,
            dayId: session.dayId,
            performedAt: session.performedAt,
            exercises: [
              {
                exerciseId: performance.exerciseId,
                exerciseName: definition.name,
                sets: performance.sets
              }
            ]
          });
        }

        grouped.set(muscleGroup, sessions);
      }
    }
  }

  return [...grouped.entries()]
    .map(([muscleGroup, sessions]) => ({
      muscleGroup,
      sessions
    }))
    .sort((left, right) => left.muscleGroup.localeCompare(right.muscleGroup));
}
