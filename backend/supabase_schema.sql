-- Copy and paste this into the Supabase SQL Editor to create the necessary table

CREATE TABLE IF NOT EXISTS public.generated_resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    linkedin_url TEXT,
    github_url TEXT,
    job_description TEXT NOT NULL,
    linkedin_data JSONB DEFAULT '{}'::jsonb,
    github_data JSONB DEFAULT '{}'::jsonb,
    generated_resume_markdown TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security if necessary for a public app, 
-- but for a simple backend-to-database connection using Anon / Service key, it's fine as is.
-- ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_text TEXT,
  parsed_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
