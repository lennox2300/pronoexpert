-- Add status_changed_at column to track when status was last modified
ALTER TABLE news ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;

-- Backfill: set status_changed_at to now() for existing rows with non-pending status
UPDATE news SET status_changed_at = now() WHERE status != 'pending' AND status_changed_at IS NULL;

-- Create trigger function to update status_changed_at when status changes
CREATE OR REPLACE FUNCTION update_news_status_changed_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_news_status_changed ON news;
CREATE TRIGGER trg_news_status_changed
  BEFORE UPDATE ON news
  FOR EACH ROW
  EXECUTE FUNCTION update_news_status_changed_at();

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job to reset infos (category = 'infos') status back to 'pending' after 24 hours
-- Runs every hour, checks for infos with status won/lost older than 24 hours
SELECT cron.schedule(
  'reset_infos_status_after_24h',
  '0 * * * *',
  $$
    UPDATE news
    SET status = 'pending'
    WHERE category = 'infos'
      AND status IN ('won', 'lost')
      AND status_changed_at IS NOT NULL
      AND status_changed_at < now() - interval '24 hours'
  $$
);

-- Reset the currently accidentally validated info
UPDATE news
SET status = 'pending', status_changed_at = null
WHERE category = 'infos' AND status = 'won';
