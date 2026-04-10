# LoadIQ

LoadIQ is an AI-assisted strength training system designed to feel like a smart personal coach. The long-term product can use AI for onboarding, explanations, and coaching, but the foundation should be deterministic training logic that is easy to test and trust.

Smarter progression. Every session.

## How To Begin

The right first milestone is a deterministic MVP:

1. Define the training data model.
2. Log completed workouts and store history.
3. Evaluate progression rules from that history.
4. Generate the next workout targets.
5. Add AI later as a thin explanation layer.

## MVP Scope

The first end-to-end flow should be:

1. Create a starter training program.
2. Log a completed workout.
3. Calculate progression decisions.
4. Generate the next workout plan.

This keeps the core trustworthy before adding AI features.

## Suggested Project Structure

When we scaffold the codebase, a good starting layout is:

```text
src/
  domain/
    types.ts
  core/
    program.ts
    logger.ts
    progression.ts
    planner.ts
  examples/
    demo.ts
```

What each module should do:

- `src/domain/types.ts`: shared domain models
- `src/core/program.ts`: starter program creation
- `src/core/logger.ts`: workout logging and history lookup
- `src/core/progression.ts`: deterministic overload rules
- `src/core/planner.ts`: next workout generation
- `src/examples/demo.ts`: simple end-to-end example

## Suggested Build Order

Build the project in this sequence:

1. Deterministic core
2. Analytics
3. AI layer

Deterministic core includes:

- training program schema
- workout session logging
- progression engine
- next workout generator

Analytics includes:

- volume by muscle group
- PR tracking
- adherence and performance trends

AI layer includes:

- progression explanations
- imported program parsing
- training summaries
- suggested program adjustments

## Tech Recommendation

A simple TypeScript setup is a good fit for the first version because it gives you:

- strong domain modeling
- easy testing of progression rules
- flexibility to grow into a CLI, API, or web app

## Next Good Tasks

After this README update, the most valuable next steps are:

1. Add a simple CLI for logging workouts.
2. Compute weekly volume by muscle group.
3. Track PRs and lift trends.
4. Add validation around imported or saved data.
5. Layer AI explanations on top of deterministic outputs.

## Current Status

The repository now includes:

- TypeScript project scaffolding
- deterministic progression logic
- an example demo flow
- JSON persistence for program and workout history
- a CLI for logging workouts into saved state
- tests for progression, planning, and storage

## Logging A Workout

After building the project, you can log a workout with:

```text
npm run log-workout -- --day upper-a --performed-at 2026-04-10T18:00:00-05:00 --exercise bench-press=8x135,8x135,8x135 --exercise barbell-row=9x115,9x115,9x115 --exercise overhead-press=5x65,5x65,4x65!
```

CLI rules:

- use one `--exercise` flag per exercise
- format each set as `reps x load`
- add `!` to a set if it was not completed
- omit `--performed-at` to use the current timestamp

## Running The Web App

To start the browser app:

```text
npm run build
npm run web
```

Then open:

```text
http://127.0.0.1:3000
```

The first web app supports:

- viewing the current program
- viewing next workouts
- viewing adherence, volume, trends, records, and history
- logging a workout from the browser
- generating a new workout plan with AI in Program Studio
- generating AI coaching summaries and next-workout explanations when `OPENAI_API_KEY` is set
- generating AI training outlooks and post-workout recaps when `OPENAI_API_KEY` is set

## Enabling AI In The Web App

To turn on AI coaching in the web app, set an OpenAI API key before starting the server:

```text
$env:OPENAI_API_KEY="your-key-here"
npm run web
```

You can optionally choose a model:

```text
$env:OPENAI_MODEL="gpt-5-mini"
npm run web
```

If you do not set `OPENAI_MODEL`, the app now defaults to `gpt-5-mini` for faster and lower-cost responses.

Current AI-powered web flows:

- generate a new program from goal, experience, frequency, and equipment
- generate and cache a coach summary
- generate and cache a trends/adherence outlook with `keep / change / watch`
- generate and cache next-workout explanations per day
- generate and cache post-workout session recaps

## Viewing The Next Workout

To inspect the next plan for a saved training day without logging anything new:

```text
npm run show-next-workout -- --day upper-a
```

## Viewing Weekly Volume

To inspect muscle-group volume from saved history:

```text
npm run show-volume
```

That defaults to the latest 7-day window in the saved sessions. You can also provide an explicit range:

```text
npm run show-volume -- --start 2026-04-05 --end 2026-04-11
```

## Viewing Lift Trends

To inspect per-exercise trends from saved history:

```text
npm run show-trends
```

Trend output compares the latest logged performance against the previous one using estimated 1RM and best completed set data.

## Viewing History

To inspect saved sessions without opening the JSON file directly:

```text
npm run show-history
npm run show-history -- --limit 5
```

## Viewing Personal Records

To inspect best load, best reps, and best estimated 1RM per exercise:

```text
npm run show-records
```

## Viewing The Program

To inspect the current saved program:

```text
npm run show-program
```

## Updating The Program

To update saved program metadata:

```text
npm run update-program -- --name "LoadIQ Base"
npm run update-program -- --split "Push / Pull / Legs" --sessions-per-week 5
```

## Adding Workout Days

To add a new workout day to the saved program:

```text
npm run add-program-day -- --id upper-b --name "Upper B"
```

## Adding Exercises

To add a new exercise to an existing workout day:

```text
npm run add-program-exercise -- --day upper-a --id incline-dumbbell-press --name "Incline Dumbbell Press" --muscle-groups chest,shoulders,triceps --target-sets 3 --rep-min 8 --rep-max 12 --load-increment 5
```

## Updating Workout Days

To rename an existing workout day:

```text
npm run update-program-day -- --id upper-a --name "Upper Strength"
```

## Removing Workout Days

To remove a workout day that is not referenced by history:

```text
npm run remove-program-day -- --id upper-b
```

## Updating Exercises

To update an existing exercise:

```text
npm run update-program-exercise -- --day upper-a --id bench-press --name "Paused Bench Press" --target-sets 4 --rep-min 4 --rep-max 6 --load-increment 5
```

## Removing Exercises

To remove an exercise that is not referenced by history:

```text
npm run remove-program-exercise -- --day upper-b --id incline-dumbbell-press
```

## Importing A Program

To import a structured program from text:

```text
npm run import-program -- --file .\program-template.txt --reset-history
```

The importer uses a deterministic text format:

```text
Program: Starter Upper / Lower
Split: Upper / Lower
SessionsPerWeek: 4

Day: upper-a | Upper A
Exercise: bench-press | Bench Press | chest,shoulders,triceps | 3 | 5-8 | 5
```

Use `--reset-history` when the imported program would otherwise conflict with saved workout history.

## Viewing Adherence

To inspect whether you are hitting the program's target training frequency:

```text
npm run show-adherence
```

That defaults to the latest 7-day window in saved history. You can also provide a custom range:

```text
npm run show-adherence -- --start 2026-04-05 --end 2026-04-11
```

## Validation

Saved state is now validated when it is loaded. If the JSON file contains unknown day ids, unknown exercises, duplicate ids, or malformed sets, the CLI will fail loudly instead of producing misleading analytics.

## Product Direction

Long term, LoadIQ can grow into these larger feature areas:

- onboarding for new or existing programs
- workout tracking and training history
- progressive overload engine
- adaptive programming
- smart daily workout generation
- weak point detection
- AI coaching and summaries
