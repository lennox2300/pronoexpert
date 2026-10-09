/*
# Add the Infos news category

1. Plain-English purpose
- Adds an `infos` category so administrators can publish informational posts from the existing news form.
- Keeps all existing news rows and their current values unchanged.

2. Modified table
- `public.news.category`: expands the allowed values from `article`, `analysis`, and `prediction` to also include `infos`.

3. Security
- No access policy is changed. Existing row-level security rules remain in force.

4. Important notes
- This is a non-destructive change: no rows, columns, or tables are deleted.
- The application will use the existing public/Premium setting to control who can see an Infos post.
*/

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT c.conname
  INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'news'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%category%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.news DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.news
  ADD CONSTRAINT news_category_check
  CHECK (category IN ('article', 'analysis', 'prediction', 'infos'));
