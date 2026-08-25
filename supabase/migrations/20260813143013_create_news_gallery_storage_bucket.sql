/*
# Create news-gallery storage bucket and policies

1. Storage
- Create a public bucket named `news-gallery` for storing images uploaded by admins for news articles.
- Bucket is public so that the image URLs can be displayed to all users (including non-VIP).

2. Security (Storage Policies)
- SELECT (read): public — anyone can view the images (anon + authenticated).
- INSERT: only authenticated users can upload.
- UPDATE: only authenticated users can modify.
- DELETE: only authenticated users can delete.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('news-gallery', 'news-gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can read news gallery" ON storage.objects;
CREATE POLICY "Public can read news gallery"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'news-gallery');

DROP POLICY IF EXISTS "Authenticated can upload news gallery" ON storage.objects;
CREATE POLICY "Authenticated can upload news gallery"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'news-gallery');

DROP POLICY IF EXISTS "Authenticated can update news gallery" ON storage.objects;
CREATE POLICY "Authenticated can update news gallery"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'news-gallery')
WITH CHECK (bucket_id = 'news-gallery');

DROP POLICY IF EXISTS "Authenticated can delete news gallery" ON storage.objects;
CREATE POLICY "Authenticated can delete news gallery"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'news-gallery');
