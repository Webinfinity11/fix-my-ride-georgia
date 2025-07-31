-- List all functions to see which ones need search_path fix
SELECT 
  proname as function_name,
  proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND prokind = 'f'
  AND proconfig IS NULL;