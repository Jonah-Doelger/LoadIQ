import { TrainingProgram } from "../domain/types";

export function createStarterProgram(): TrainingProgram {
  return {
    id: "program-1",
    name: "Starter Upper / Lower",
    split: "Upper / Lower",
    sessionsPerWeek: 4,
    days: [
      {
        id: "upper-a",
        name: "Upper A",
        exercises: [
          {
            id: "bench-press",
            name: "Bench Press",
            muscleGroups: ["chest", "shoulders", "triceps"],
            targetSets: 3,
            repRange: { min: 5, max: 8 },
            loadIncrement: 5
          },
          {
            id: "barbell-row",
            name: "Barbell Row",
            muscleGroups: ["back", "biceps"],
            targetSets: 3,
            repRange: { min: 6, max: 10 },
            loadIncrement: 5
          },
          {
            id: "overhead-press",
            name: "Overhead Press",
            muscleGroups: ["shoulders", "triceps"],
            targetSets: 3,
            repRange: { min: 5, max: 8 },
            loadIncrement: 2.5
          }
        ]
      },
      {
        id: "lower-a",
        name: "Lower A",
        exercises: [
          {
            id: "back-squat",
            name: "Back Squat",
            muscleGroups: ["quads", "glutes", "core"],
            targetSets: 3,
            repRange: { min: 5, max: 8 },
            loadIncrement: 5
          },
          {
            id: "romanian-deadlift",
            name: "Romanian Deadlift",
            muscleGroups: ["hamstrings", "glutes", "back"],
            targetSets: 3,
            repRange: { min: 6, max: 10 },
            loadIncrement: 5
          },
          {
            id: "calf-raise",
            name: "Standing Calf Raise",
            muscleGroups: ["calves"],
            targetSets: 3,
            repRange: { min: 10, max: 15 },
            loadIncrement: 5
          }
        ]
      }
    ]
  };
}
