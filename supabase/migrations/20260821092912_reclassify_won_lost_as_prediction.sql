-- Reclass all won/lost news entries from 'article' to 'prediction'
-- so they appear in the Premium history grouped by month.
UPDATE news
SET category = 'prediction'
WHERE status IN ('won', 'lost')
  AND category = 'article';