/*
# Add gallery images column to news table

1. Changes
- Add `gallery_images` column (text[]) to the `news` table.
- This column stores an array of public URLs for images uploaded directly by the admin.
- Allows multiple images per news article (e.g. 4 screenshots) that will be displayed as a carousel/slideshow.
- Nullable: existing rows have NULL, which means "no gallery" — the existing single `image_url` is still used as the thumbnail.

2. Security
- No new RLS policies needed: the column inherits the existing news table policies.
- Only admins can insert/update (existing policy).
- All users can read (existing policy).
*/

ALTER TABLE news
ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT NULL;
