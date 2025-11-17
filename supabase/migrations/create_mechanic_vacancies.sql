-- Create mechanic_vacancies table
CREATE TABLE IF NOT EXISTS public.mechanic_vacancies (
  id BIGSERIAL PRIMARY KEY,
  mechanic_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT title_not_empty CHECK (char_length(title) > 0)
);

-- Create index for faster queries
CREATE INDEX idx_mechanic_vacancies_mechanic_id ON public.mechanic_vacancies(mechanic_id);
CREATE INDEX idx_mechanic_vacancies_is_active ON public.mechanic_vacancies(is_active);
CREATE INDEX idx_mechanic_vacancies_created_at ON public.mechanic_vacancies(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.mechanic_vacancies ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view active vacancies
CREATE POLICY "Anyone can view active vacancies"
ON public.mechanic_vacancies
FOR SELECT
USING (is_active = true);

-- Mechanics can view their own vacancies (including inactive ones)
CREATE POLICY "Mechanics can view their own vacancies"
ON public.mechanic_vacancies
FOR SELECT
USING (auth.uid() = mechanic_id);

-- Mechanics can insert their own vacancies
CREATE POLICY "Mechanics can create vacancies"
ON public.mechanic_vacancies
FOR INSERT
WITH CHECK (auth.uid() = mechanic_id);

-- Mechanics can update their own vacancies
CREATE POLICY "Mechanics can update their vacancies"
ON public.mechanic_vacancies
FOR UPDATE
USING (auth.uid() = mechanic_id)
WITH CHECK (auth.uid() = mechanic_id);

-- Mechanics can delete their own vacancies
CREATE POLICY "Mechanics can delete their vacancies"
ON public.mechanic_vacancies
FOR DELETE
USING (auth.uid() = mechanic_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all vacancies"
ON public.mechanic_vacancies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_mechanic_vacancies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER update_mechanic_vacancies_updated_at
BEFORE UPDATE ON public.mechanic_vacancies
FOR EACH ROW
EXECUTE FUNCTION public.update_mechanic_vacancies_updated_at();

-- Grant permissions
GRANT SELECT ON public.mechanic_vacancies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.mechanic_vacancies TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.mechanic_vacancies_id_seq TO authenticated;
