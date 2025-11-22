-- Drop the old check constraint
ALTER TABLE auto_leads DROP CONSTRAINT IF EXISTS auto_leads_lead_type_check;

-- Add new check constraint with all lead types
ALTER TABLE auto_leads ADD CONSTRAINT auto_leads_lead_type_check 
  CHECK (lead_type IN ('leasing', 'dealers', 'insurance', 'service', 'drive', 'laundry', 'vacancy'));