-- Add missing location fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cidade_nascimento text,
ADD COLUMN IF NOT EXISTS estado_nascimento text,
ADD COLUMN IF NOT EXISTS pais_nascimento text,
ADD COLUMN IF NOT EXISTS fuso_horario_nascimento text,
ADD COLUMN IF NOT EXISTS status text;

-- Update RLS policies to include new fields
-- The existing policies already cover all columns with SELECT/INSERT/UPDATE permissions