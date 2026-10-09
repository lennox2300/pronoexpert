-- Grant UPDATE privilege to authenticated role on news table
-- Without this, admin users (who are authenticated) cannot update news rows,
-- even though the RLS policy allows it. RLS policies are checked AFTER
-- table-level GRANTs, so both must permit the action.
GRANT UPDATE ON news TO authenticated;