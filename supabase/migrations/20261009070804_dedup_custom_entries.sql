/*
# Deduplicate custom_entries and add uniqueness constraint

1. Problem
   The `saveCustomEntry` function used `.maybeSingle()` to check for existing
   rows before inserting. When duplicates already existed (2+ rows with the
   same entry_type + name), `.maybeSingle()` returns an error instead of data,
   so the code believed no entry existed and inserted yet another copy.
   This snowballed: every new ticket created more duplicates.

2. Fix applied in this migration
   - Deduplicate existing rows: for each group of duplicates
     (same entry_type + lower(name) + COALESCE(competition, '')), keep only
     the oldest row (by created_at) and delete the rest.
   - Add a unique index on (entry_type, lower(name), COALESCE(competition, ''))
     so the database itself prevents future duplicates even if the frontend
     check fails.

3. What changes
   - Deletes duplicate rows from `custom_entries`, keeping the oldest.
   - Creates `idx_custom_entries_unique` unique index.
   - No column changes, no table changes, no RLS changes.

4. Notes
   - The unique index uses `lower(name)` so "Lens", "lens", and "LENS" are
     treated as the same entry (case-insensitive uniqueness).
   - For teams, `competition` is part of the key so the same team name in
     different leagues is allowed.
   - For leagues and bet_types, `competition` is NULL, so COALESCE maps it
     to an empty string for consistent comparison.
*/

-- Step 1: Delete duplicates, keeping the oldest row per group
DELETE FROM custom_entries
WHERE id NOT IN (
  SELECT DISTINCT ON (entry_type, lower(name), COALESCE(competition, ''))
    id
  FROM custom_entries
  ORDER BY entry_type, lower(name), COALESCE(competition, ''), created_at ASC
);

-- Step 2: Add unique index to prevent future duplicates
DROP INDEX IF EXISTS idx_custom_entries_unique;
CREATE UNIQUE INDEX idx_custom_entries_unique
  ON custom_entries (entry_type, lower(name), COALESCE(competition, ''));
