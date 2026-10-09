/*
  # Add status, category and created_by fields to news table

  1. Changes
    - Add `status` column (pending, won, lost) for tracking analysis results
    - Add `category` column (article, analysis, prediction) for news categorization
    - Add `created_by` column to track who created the news
    - Set default status to 'pending'
    - Set default category to 'article'

  2. Notes
    - Existing news entries will have status='pending' and category='article'
    - created_by will be nullable for existing entries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news' AND column_name = 'status'
  ) THEN
    ALTER TABLE news ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news' AND column_name = 'category'
  ) THEN
    ALTER TABLE news ADD COLUMN category text DEFAULT 'article' CHECK (category IN ('article', 'analysis', 'prediction'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE news ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;