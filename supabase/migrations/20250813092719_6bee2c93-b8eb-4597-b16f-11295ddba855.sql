-- Fix contact_messages security vulnerability
-- Remove the overly permissive INSERT policy that allows public access
DROP POLICY IF EXISTS "Users can create contact messages" ON public.contact_messages;

-- Create a new policy that only allows authenticated users to create contact messages
CREATE POLICY "Authenticated users can create contact messages"
  ON public.contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also update the contact form RPC function to handle authentication properly
CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_name text, 
  p_email text, 
  p_subject text, 
  p_message text, 
  p_topic text, 
  p_user_id uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow authenticated users to submit contact messages
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit contact messages';
  END IF;
  
  INSERT INTO public.contact_messages (
    name, 
    email, 
    subject, 
    message, 
    topic, 
    user_id
  ) VALUES (
    p_name,
    p_email,
    p_subject,
    p_message,
    p_topic,
    COALESCE(p_user_id, auth.uid())
  );
END;
$function$;