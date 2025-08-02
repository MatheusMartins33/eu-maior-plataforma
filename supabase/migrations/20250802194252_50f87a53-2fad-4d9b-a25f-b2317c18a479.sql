-- Create table for public profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  data_nascimento date,
  hora_nascimento time without time zone,
  local_nascimento text,
  updated_at timestamp with time zone
);

-- Set up Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis públicos são visíveis para todos." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem inserir seu próprio perfil." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);