import assert from "node:assert/strict";
import { createStarterProgram } from "../core/program";
import {
  addExerciseToDay,
  addWorkoutDay,
  parseMuscleGroups,
  removeExerciseFromDay,
  removeWorkoutDay,
  updateExerciseInDay,
  updateProgram,
  updateWorkoutDay
} from "../core/programEditor";
import { createTrainingState } from "../core/state";

export function runProgramEditorTests(): void {
  const program = createStarterProgram();
  const updated = updateProgram(program, {
    name: "LoadIQ Base",
    split: "Push / Pull / Legs",
    sessionsPerWeek: 5
  });

  assert.equal(updated.name, "LoadIQ Base");
  assert.equal(updated.split, "Push / Pull / Legs");
  assert.equal(updated.sessionsPerWeek, 5);
  assert.equal(program.name, "Starter Upper / Lower");

  {
    const withDay = addWorkoutDay(program, {
      id: "upper-b",
      name: "Upper B"
    });

    assert.equal(withDay.days.length, program.days.length + 1);
    assert.equal(withDay.days.at(-1)?.id, "upper-b");
  }

  {
    const withExercise = addExerciseToDay(program, {
      dayId: "upper-a",
      exercise: {
        id: "incline-dumbbell-press",
        name: "Incline Dumbbell Press",
        muscleGroups: parseMuscleGroups("chest,shoulders,triceps"),
        targetSets: 3,
        repRange: {
          min: 8,
          max: 12
        },
        loadIncrement: 5
      }
    });

    const upperDay = withExercise.days.find((day) => day.id === "upper-a");

    assert.ok(upperDay);
    assert.equal(upperDay.exercises.some((exercise) => exercise.id === "incline-dumbbell-press"), true);
  }

  assert.throws(() => addWorkoutDay(program, { id: "upper-a", name: "Duplicate" }), {
    message: 'Workout day "upper-a" already exists.'
  });

  assert.throws(
    () =>
      addExerciseToDay(program, {
        dayId: "missing-day",
        exercise: {
          id: "incline-dumbbell-press",
          name: "Incline Dumbbell Press",
          muscleGroups: parseMuscleGroups("chest"),
          targetSets: 3,
          repRange: {
            min: 8,
            max: 12
          },
          loadIncrement: 5
        }
      }),
    {
      message: 'Workout day "missing-day" does not exist.'
    }
  );

  {
    const updatedDay = updateWorkoutDay(program, {
      dayId: "upper-a",
      name: "Upper Strength"
    });

    assert.equal(updatedDay.days.find((day) => day.id === "upper-a")?.name, "Upper Strength");
  }

  {
    const updatedExercise = updateExerciseInDay(program, {
      dayId: "upper-a",
      exerciseId: "bench-press",
      name: "Paused Bench Press",
      targetSets: 4,
      repMin: 4,
      repMax: 6
    });

    const bench = updatedExercise.days
      .find((day) => day.id === "upper-a")
      ?.exercises.find((exercise) => exercise.id === "bench-press");

    assert.ok(bench);
    assert.equal(bench.name, "Paused Bench Press");
    assert.equal(bench.targetSets, 4);
    assert.equal(bench.repRange.min, 4);
    assert.equal(bench.repRange.max, 6);
  }

  {
    const programWithEmptyDay = addWorkoutDay(program, {
      id: "upper-b",
      name: "Upper B"
    });
    const state = createTrainingState(programWithEmptyDay, []);
    const removedDay = removeWorkoutDay(state, "upper-b");

    assert.equal(removedDay.days.some((day) => day.id === "upper-b"), false);
  }

  {
    const programWithExercise = addWorkoutDay(program, {
      id: "upper-b",
      name: "Upper B"
    });
    const programWithAddedExercise = addExerciseToDay(programWithExercise, {
      dayId: "upper-b",
      exercise: {
        id: "incline-dumbbell-press",
        name: "Incline Dumbbell Press",
        muscleGroups: parseMuscleGroups("chest,shoulders,triceps"),
        targetSets: 3,
        repRange: {
          min: 8,
          max: 12
        },
        loadIncrement: 5
      }
    });
    const removedExercise = removeExerciseFromDay(
      createTrainingState(programWithAddedExercise, []),
      "upper-b",
      "incline-dumbbell-press"
    );

    const upperB = removedExercise.days.find((day) => day.id === "upper-b");

    assert.ok(upperB);
    assert.equal(upperB.exercises.length, 0);
  }

  assert.throws(
    () => removeWorkoutDay(createTrainingState(program, [{ id: "session-1", dayId: "upper-a", performedAt: "2026-04-09T18:00:00-05:00", exercises: [] }]), "upper-a"),
    {
      message: 'Cannot remove workout day "upper-a" because it exists in workout history.'
    }
  );

  assert.throws(
    () =>
      removeExerciseFromDay(
        createTrainingState(program, [
          {
            id: "session-1",
            dayId: "upper-a",
            performedAt: "2026-04-09T18:00:00-05:00",
            exercises: [{ exerciseId: "bench-press", sets: [{ reps: 8, load: 135, completed: true }] }]
          }
        ]),
        "upper-a",
        "bench-press"
      ),
    {
      message: 'Cannot remove exercise "bench-press" because it exists in workout history.'
    }
  );
}
