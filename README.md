# LoadIQ
An AI-assisted strength training system that acts like a personal coach-- tracking workouts, applying progressive overload, analyzing performance, and continously adapting your program so you improve with minimal thinking.

***Smarter progression. Every session.***

---

## Core Features

### Onboarding

1. Start Fresh  
  - AI:
    - Generates initial full training program:
      - split (PPL / UL / full body etc.)
      - exercises
      - sets/reps
  - Deterministic:
    - Converts generated program into structured training data
    - Initializes progression tracking system

2. Import Existing Program  
  - AI:
    - Parses user-provided program (text / messy input → structured format)
  - Deterministic:
    - Calculates:
      - weekly volume per muscle group
      - training frequency
      - baseline progression state

---

### Workout Tracking System (Deterministic Core)

- Log:
  - exercises
  - sets
  - reps
  - weights
- Stores full training history
- Computes:
  - volume per muscle group
  - performance trends over time
  - personal records (PRs)

---

### Progressive Overload Engine (CORE)

- Deterministic:
  - Detects:
    - completed vs missed targets
    - strength trends (session-over-session progression)
  - Decides:
    - increase load
    - maintain load
    - deload
  - Generates:
    - next session targets (sets, reps, weight)

- AI:
  - Explains progression decisions in natural language (optional layer)

---

### AI Coaching Layer (AI)

- Plateau explanations
- Recovery warnings (based on structured inputs)
- Volume imbalance feedback
- Training advice in natural language
- Summarization of training progress over time

---

### Adaptive Programming

- Deterministic:
  - Updates program structure based on:
    - performance trends
    - consistency (adherence)
    - fatigue signals (numerical inputs or derived metrics)
  - Adjusts:
    - exercise selection rules
    - weekly volume
    - progression speed

- AI:
  - Suggests possible program improvements
  - Explains program changes in user-friendly language

---

### Smart Workout Generator

- Deterministic:
  - Generates “today’s workout” based on:
    - program structure
    - progressive overload engine outputs
    - fatigue / recovery rules (if enabled)
  - Adjusts:
    - sets, reps, and load targets

- AI:
  - Optional context layer:
    - “why this workout today”
    - motivational / coaching explanation

---

### Weak Point Detection

- Deterministic:
  - Analyzes:
    - muscle group volume balance
    - lift progression rates
    - strength ratios (e.g. push vs pull, quad vs hamstring)
  - Detects:
    - undertrained muscle groups
    - persistent imbalances

- AI:
  - Converts findings into clear coaching feedback
  - Suggests training emphasis adjustments (non-binding)

---
