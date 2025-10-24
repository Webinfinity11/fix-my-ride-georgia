-- Add foreign key constraint between mechanic_services and profiles
ALTER TABLE mechanic_services 
ADD CONSTRAINT fk_mechanic_services_profiles 
FOREIGN KEY (mechanic_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_mechanic_services_mechanic_id 
ON mechanic_services(mechanic_id);