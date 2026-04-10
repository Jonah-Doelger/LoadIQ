import { AdherenceSummary, TrainingProgram, WorkoutSession } from "../domain/types";
import { buildLastSevenDayRange } from "./volume";
import { formatDate } from "../cli/showVolume";

interface DateRange {
  start: Date;
  end: Date;
}

export function buildAdherenceSummary(
  program: TrainingProgram,
  sessions: WorkoutSession[],
  range?: DateRange
): AdherenceSummary | undefined {
  const resolvedRange = range ?? buildLastSevenDayRange(sessions);

  if (!resolvedRange) {
    return undefined;
  }

  const sessionsInRange = sessions.filter((session) => {
    const performedAt = new Date(session.performedAt);
    return performedAt >= resolvedRange.start && performedAt <= resolvedRange.end;
  });
  const completedWorkoutDays = new Set(sessionsInRange.map((session) => session.dayId)).size;
  const completedSessions = sessionsInRange.length;
  const targetSessions = program.sessionsPerWeek;
  const adherenceRate =
    targetSessions === 0 ? 0 : Math.min(1, completedSessions / targetSessions);

  return {
    windowStart: formatDate(resolvedRange.start),
    windowEnd: formatDate(resolvedRange.end),
    completedSessions,
    targetSessions,
    adherenceRate: roundToOneDecimal(adherenceRate * 100),
    completedWorkoutDays,
    availableWorkoutDays: program.days.length,
    missedSessions: Math.max(0, targetSessions - completedSessions)
  };
}

export function buildAdherenceRange(start?: string, end?: string): DateRange | undefined {
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

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
