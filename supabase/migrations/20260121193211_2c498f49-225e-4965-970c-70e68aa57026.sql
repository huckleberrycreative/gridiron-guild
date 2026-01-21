-- Add practice_squad column to player_salaries table
ALTER TABLE public.player_salaries 
ADD COLUMN practice_squad BOOLEAN NOT NULL DEFAULT false;