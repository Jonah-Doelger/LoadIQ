import { ExerciseDefinition, MuscleGroup, TrainingProgram, TrainingState, WorkoutDay } from "../domain/types";

export interface ProgramUpdateInput {
  name?: string;
  split?: string;
  sessionsPerWeek?: number;
}

export function updateProgram(
  program: TrainingProgram,
  updates: ProgramUpdateInput
): TrainingProgram {
  return {
    ...program,
    name: updates.name ?? program.name,
    split: updates.split ?? program.split,
    sessionsPerWeek: updates.sessionsPerWeek ?? program.sessionsPerWeek
  };
}

export interface AddWorkoutDayInput {
  id: string;
  name: string;
}

export interface AddExerciseInput {
  dayId: string;
  exercise: ExerciseDefinition;
}

export function addWorkoutDay(
  program: TrainingProgram,
  input: AddWorkoutDayInput
): TrainingProgram {
  if (program.days.some((day) => day.id === input.id)) {
    throw new Error(`Workout day "${input.id}" already exists.`);
  }

  const newDay: WorkoutDay = {
    id: input.id,
    name: input.name,
    exercises: []
  };

  return {
    ...program,
    days: [...program.days, newDay]
  };
}

export function addExerciseToDay(
  program: TrainingProgram,
  input: AddExerciseInput
): TrainingProgram {
  if (program.days.some((day) => day.exercises.some((exercise) => exercise.id === input.exercise.id))) {
    throw new Error(`Exercise "${input.exercise.id}" already exists in the program.`);
  }

  let foundDay = false;

  const days = program.days.map((day) => {
    if (day.id !== input.dayId) {
      return day;
    }

    foundDay = true;

    return {
      ...day,
      exercises: [...day.exercises, input.exercise]
    };
  });

  if (!foundDay) {
    throw new Error(`Workout day "${input.dayId}" does not exist.`);
  }

  return {
    ...program,
    days
  };
}

export function parseMuscleGroups(value: string): MuscleGroup[] {
  const allowedGroups: MuscleGroup[] = [
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "quads",
    "hamstrings",
    "glutes",
    "calves",
    "core"
  ];
  const groups = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry): entry is MuscleGroup => allowedGroups.includes(entry as MuscleGroup));

  if (groups.length === 0) {
    throw new Error("Provide at least one valid muscle group.");
  }

  if (groups.length !== value.split(",").map((entry) => entry.trim()).filter(Boolean).length) {
    throw new Error("One or more muscle groups are invalid.");
  }

  return groups;
}

export interface WorkoutDayUpdateInput {
  dayId: string;
  name?: string;
}

export interface ExerciseUpdateInput {
  dayId: string;
  exerciseId: string;
  name?: string;
  muscleGroups?: MuscleGroup[];
  targetSets?: number;
  repMin?: number;
  repMax?: number;
  loadIncrement?: number;
}

export function updateWorkoutDay(
  program: TrainingProgram,
  input: WorkoutDayUpdateInput
): TrainingProgram {
  let foundDay = false;

  const days = program.days.map((day) => {
    if (day.id !== input.dayId) {
      return day;
    }

    foundDay = true;

    return {
      ...day,
      name: input.name ?? day.name
    };
  });

  if (!foundDay) {
    throw new Error(`Workout day "${input.dayId}" does not exist.`);
  }

  return {
    ...program,
    days
  };
}

export function removeWorkoutDay(
  state: TrainingState,
  dayId: string
): TrainingProgram {
  if (state.history.some((session) => session.dayId === dayId)) {
    throw new Error(`Cannot remove workout day "${dayId}" because it exists in workout history.`);
  }

  const nextDays = state.program.days.filter((day) => day.id !== dayId);

  if (nextDays.length === state.program.days.length) {
    throw new Error(`Workout day "${dayId}" does not exist.`);
  }

  if (nextDays.length === 0) {
    throw new Error("Program must contain at least one workout day.");
  }

  return {
    ...state.program,
    days: nextDays
  };
}

export function updateExerciseInDay(
  program: TrainingProgram,
  input: ExerciseUpdateInput
): TrainingProgram {
  let foundDay = false;
  let foundExercise = false;

  const days = program.days.map((day) => {
    if (day.id !== input.dayId) {
      return day;
    }

    foundDay = true;

    const exercises = day.exercises.map((exercise) => {
      if (exercise.id !== input.exerciseId) {
        return exercise;
      }

      foundExercise = true;

      return {
        ...exercise,
        name: input.name ?? exercise.name,
        muscleGroups: input.muscleGroups ?? exercise.muscleGroups,
        targetSets: input.targetSets ?? exercise.targetSets,
        repRange: {
          min: input.repMin ?? exercise.repRange.min,
          max: input.repMax ?? exercise.repRange.max
        },
        loadIncrement: input.loadIncrement ?? exercise.loadIncrement
      };
    });

    return {
      ...day,
      exercises
    };
  });

  if (!foundDay) {
    throw new Error(`Workout day "${input.dayId}" does not exist.`);
  }

  if (!foundExercise) {
    throw new Error(`Exercise "${input.exerciseId}" does not exist in "${input.dayId}".`);
  }

  return {
    ...program,
    days
  };
}

export function removeExerciseFromDay(
  state: TrainingState,
  dayId: string,
  exerciseId: string
): TrainingProgram {
  if (
    state.history.some((session) =>
      session.exercises.some((exercise) => exercise.exerciseId === exerciseId)
    )
  ) {
    throw new Error(`Cannot remove exercise "${exerciseId}" because it exists in workout history.`);
  }

  let foundDay = false;
  let foundExercise = false;

  const days = state.program.days.map((day) => {
    if (day.id !== dayId) {
      return day;
    }

    foundDay = true;

    const exercises = day.exercises.filter((exercise) => {
      const shouldKeep = exercise.id !== exerciseId;

      if (!shouldKeep) {
        foundExercise = true;
      }

      return shouldKeep;
    });

    return {
      ...day,
      exercises
    };
  });

  if (!foundDay) {
    throw new Error(`Workout day "${dayId}" does not exist.`);
  }

  if (!foundExercise) {
    throw new Error(`Exercise "${exerciseId}" does not exist in "${dayId}".`);
  }

  return {
    ...state.program,
    days
  };
}
