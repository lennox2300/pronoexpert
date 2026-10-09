/*
# Add analysis fields to predictions table

1. Modified Tables
- `predictions`: adds three new nullable columns for optional analysis content.
  - `analysis_text` (text): Optional written analysis displayed below the ticket.
  - `analysis_audio_url` (text): Optional URL to an audio file (mp3, etc.) for the analysis.
  - `analysis_video_url` (text): Optional URL to a video file or YouTube link for the analysis.

2. Security
- No changes to RLS policies. The existing policies on `predictions` already control
  read/write access. The new columns inherit the same row-level access as the rest of the row.

3. Notes
- All three columns are nullable so existing predictions are unaffected.
- If none of the three columns have content, the ticket displays exactly as before.
- The frontend will show a small "Analyse" toggle only when at least one field is non-empty.
*/