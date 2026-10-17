# Architecture rules

- Trade Finder uses a pure tradeFinder module with Trade Value Chart exchange values, directional received-versus-sent value targets and roster-aware weekly lineup gains; isolate search and assessment rules for deterministic testing without changing Trade Analyzer valuation.

- Apply display-only Power Ranks deductions in the table before ranking and sorting; preserve the shared projection and simulation model for trade and waiver calculations.
- Season odds use the pure roster-aware seasonSimulation module with seeded player availability paths and live NFL schedule context; keeping it separate makes injury, bye and playoff rules independently testable and before/after scenarios reproducible.
- Power Ranks selects the actual-average strength mode explicitly; trade and waiver callers retain the shared blended default so forecast presentation changes do not silently change asset valuation.
- Fetch public NFL schedule/defense inputs through the fixed-URL cached nfl-schedule edge function because ESPN's browser CORS support is unreliable; bundle the dated verified snapshot inside the function so upstream outages return successful fallback data rather than 502, and retain the client snapshot fallback with disclosure.
- Trade/waiver valuation uses 2027+ salaries only; the current-year salary column is historical (last year's locked-in number), except 2026 draftees and waiver pickups whose current salary carries forward.