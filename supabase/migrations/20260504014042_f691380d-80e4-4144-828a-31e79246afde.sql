DELETE FROM player_salaries
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY player_id, team_id ORDER BY created_at) AS rn
    FROM player_salaries
    WHERE team_id IS NOT NULL
  ) t WHERE rn > 1
);