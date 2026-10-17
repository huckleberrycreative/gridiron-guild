# Architecture rules

- Apply display-only Power Ranks deductions in the table before ranking and sorting; preserve the shared projection and simulation model for trade and waiver calculations.
- Season odds use the pure roster-aware seasonSimulation module with seeded player availability paths and live NFL schedule context; keeping it separate makes injury, bye and playoff rules independently testable and before/after scenarios reproducible.
- Trade/waiver valuation uses 2027+ salaries only; the current-year salary column is historical (last year's locked-in number), except 2026 draftees and waiver pickups whose current salary carries forward.