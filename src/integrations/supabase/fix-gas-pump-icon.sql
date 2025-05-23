
-- Update any service categories that use the 'gas-pump' icon to ensure compatibility
UPDATE public.service_categories 
SET icon = 'fuel'
WHERE icon = 'gas-pump';
