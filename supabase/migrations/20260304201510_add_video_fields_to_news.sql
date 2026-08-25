/*
  # Add video fields to news table

  1. Changes
    - Add `youtube_url` column to store YouTube video links (optional)
    - Add `dropbox_video_url` column to store Dropbox video links (optional)
  
  2. Notes
    - Both fields are optional and nullable
    - Articles can have either a YouTube video, a Dropbox video, or neither
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news' AND column_name = 'youtube_url'
  ) THEN
    ALTER TABLE news ADD COLUMN youtube_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news' AND column_name = 'dropbox_video_url'
  ) THEN
    ALTER TABLE news ADD COLUMN dropbox_video_url text;
  END IF;
END $$;