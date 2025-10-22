-- Drop old foreign key pointing to auth.users (if exists)
ALTER TABLE saved_services
DROP CONSTRAINT IF EXISTS saved_services_user_id_fkey;

-- Add correct foreign key pointing to profiles
ALTER TABLE saved_services
ADD CONSTRAINT saved_services_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Ensure index exists for performance
CREATE INDEX IF NOT EXISTS idx_saved_services_user_id 
ON saved_services(user_id);