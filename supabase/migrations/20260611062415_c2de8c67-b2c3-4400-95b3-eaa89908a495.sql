ALTER TABLE public.mechanic_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE TRIGGER update_mechanic_profiles_updated_at
BEFORE UPDATE ON public.mechanic_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();