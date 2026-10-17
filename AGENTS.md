# Architecture rules

- Best Salaries uses an isolated pure bestSalaries scoring-per-dollar model with observed PPG, explicit projection fallbacks and all forward contract years; do not let contract-efficiency presentation change shared Trade Analyzer valuation.

- Roast My Team reads representative modal seed-and-exit scenarios from an observational season-simulation callback that never changes random draws or shared odds; its sequential named trade plans use actual roster utility or shared cap-compliant dynasty strength, require a partner benefit and exclude unpaired tags so editorial advice does not change valuation.
- Dynasty roster strength is exposed as a pure helper using the table’s age adjustments, cap cuts and strength formula so Roast trade plans measure the same next-year benchmark without rerunning odds for every candidate.
- Dynasty table and Roast My Team share the pure dynastyRanks module with seeded simulations to keep reported dynasty positions reproducible across pages without altering the existing strength and cap formulas.

- Trade Finder uses a pure tradeFinder module with Trade Value Chart exchange values, directional received-versus-sent value targets and roster-aware weekly lineup gains; isolate search and assessment rules for deterministic testing without changing Trade Analyzer valuation.
- Trade Finder applies submitted player IDs only to outgoing candidates, never to the retained roster; assigned Practice Squad players are selectable assets but count toward lineup utility only as active incoming additions, preventing protected-player and bench-strength distortions.
- Strategy-driven Trade Finder uses a dedicated pure strategy module and a cancellable web worker for paired championship simulations; preserve shared analyzer values and clearly disclose schedule-neutral next-season forecasts so search stays responsive without presenting unknown future schedules as facts.

- Apply display-only Power Ranks deductions in the table before ranking and sorting; preserve the shared projection and simulation model for trade and waiver calculations.
- Season odds use the pure roster-aware seasonSimulation module with seeded player availability paths and live NFL schedule context; keeping it separate makes injury, bye and playoff rules independently testable and before/after scenarios reproducible.
- Power Ranks selects the actual-average strength mode explicitly; trade and waiver callers retain the shared blended default so forecast presentation changes do not silently change asset valuation.
- Fetch public NFL schedule/defense inputs through the fixed-URL cached nfl-schedule edge function because ESPN's browser CORS support is unreliable; bundle the dated verified snapshot inside the function so upstream outages return successful fallback data rather than 502, and retain the client snapshot fallback with disclosure.
- Trade/waiver valuation uses 2027+ salaries only; the current-year salary column is historical (last year's locked-in number), except 2026 draftees and waiver pickups whose current salary carries forward.