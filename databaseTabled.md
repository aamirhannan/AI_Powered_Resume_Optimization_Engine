-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. USER SETTINGS (Map: userWorkspaceData)
-- Stores configuration per user. Assuming 1-to-1 mapping with Auth User for now.
-- -----------------------------------------------------------------------------
create table public.user_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  workspace_id uuid default gen_random_uuid() not null,
  blocked_emails text[] default array[]::text[],
  blocked_domains text[] default array[]::text[],
  daily_limit int default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 2. MASTER RESUMES (Map: userRoleTable)
-- The "Source of Truth" resumes (e.g., "Generic Frontend", "Generic Backend")
-- -----------------------------------------------------------------------------
create table public.master_resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null, -- e.g., 'frontend', 'backend'
  content jsonb not null, -- The full resume JSON structure
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Prevent duplicate roles for the same user? Optional constraint:
  unique(user_id, role)
);

-- -----------------------------------------------------------------------------
-- 3. GENERATED RESUMES (Map: resumeTable)
-- The tailored/PDF assets created from a master for a specific purpose.
-- -----------------------------------------------------------------------------
create table public.generated_resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  master_resume_id uuid references public.master_resumes(id) on delete set null,
  
  file_path text, -- Path in Supabase Storage (e.g. 'resumes/abc-123.pdf')
  content jsonb, -- The tailored JSON content (if different from master)
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 4. EMAIL AUTOMATIONS (Map: emailAutomationTable)
-- Jobs that apply via Email.
-- -----------------------------------------------------------------------------
create table public.email_automations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- The Asset used for this job
  generated_resume_id uuid references public.generated_resumes(id) on delete set null,
  
  target_email text not null,
  sender_email text not null,
  job_description text,
  role text,
  company text,
  subject_line text,
  cover_letter text,
  
  status text check (status in ('PENDING', 'IN_PROGRESS', 'FAILED', 'SUCCESS')) default 'PENDING',
  error text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 5. FOUNDER OUTREACHES (Map: foundersOutreachTable)
-- Jobs that reach out via LinkedIn/DM.
-- -----------------------------------------------------------------------------
create table public.founder_outreaches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  generated_resume_id uuid references public.generated_resumes(id) on delete set null,
  
  linkedin_profile text,
  founder_details jsonb, -- Scraped or provided info about the founder
  job_description text,
  role text,
  cover_letter text,
  subject_line text,
  
  status text check (status in ('PENDING', 'IN_PROGRESS', 'FAILED', 'SUCCESS')) default 'PENDING',
  error text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 6. RESUME GENERATIONS (Map: resumeGenerationTable)
-- Standalone generation tasks (PDF only, no sending).
-- -----------------------------------------------------------------------------
create table public.resume_generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  generated_resume_id uuid references public.generated_resumes(id) on delete set null,
  
  role text,
  prev_resume_content jsonb, -- Snapshot of input
  new_resume_content jsonb, -- Snapshot of output
  
  status text check (status in ('PENDING', 'IN_PROGRESS', 'FAILED', 'SUCCESS')) default 'PENDING',
  error text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 7. API EVENT TRACKER (Map: apiRequestLogs)
-- Single-row-per-request tracking for Major Flows (Resume, Email, Outreach).
-- Stores the Request, Response, and a JSON log of internal steps.
-- -----------------------------------------------------------------------------
create table public.api_request_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Categorization
  type text check (type in ('EMAIL_AUTOMATION', 'RESUME_GENERATION', 'FOUNDERS_OUTREACH')) not null,
  endpoint text not null, -- e.g. '/resume-generation/create-resume'
  
  -- The IO
  request_payload jsonb,  -- What the user sent
  response_payload jsonb, -- What we sent back (updated on completion)
  
  -- Status
  status text check (status in ('PENDING', 'SUCCESS', 'FAILED')) default 'PENDING',
  status_code int, -- HTTP Status Code (200, 500, etc.)
  
  -- Internal Execution History (Array of Objects)
  -- Structure: [{ "step": "LLM", "status": "DONE", "duration": 400, "details": {...} }, ...]
  execution_logs jsonb default '[]'::jsonb,
  
  -- Performance / Meta
  duration_ms int, -- Total time taken
  error_message text, -- Top level error if failed
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 8. JOB PROFILES (Hybrid Storage for Resume Data)
-- Stores user's resume/profile data with a hybrid approach:
-- - Flat fields for frequently accessed data (name, contact info, summary)
-- - JSONB for complex nested structures (skills, experience, projects)
-- -----------------------------------------------------------------------------
create table public.job_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  
  -- Profile identifier (e.g., 'fullstack', 'frontend', 'backend', 'data_engineer')
  profile_type text not null,
  
  -- Flat fields (frequently queried/updated)
  full_name varchar(255),
  email varchar(255),
  phone varchar(50),
  location varchar(255),
  professional_summary text,
  
  -- Semi-structured sections as JSONB
  links jsonb default '{}'::jsonb,
  -- Structure: {"linkedin": "url", "github": "url", "leetcode": "url", ...}
  
  education jsonb default '{}'::jsonb,
  -- Structure: {"degree": "...", "institution": "...", "duration": {"start": "...", "end": "..."}}
  
  technical_skills jsonb default '{}'::jsonb,
  -- Structure: {"programmingLanguages": [...], "frontend": [...], "backend": [...], ...}
  
  experience jsonb default '[]'::jsonb,
  -- Structure: [{"role": "...", "company": "...", "duration": {...}, "responsibilitiesAndAchievements": [...], "technologies": [...]}]
  
  projects jsonb default '[]'::jsonb,
  -- Structure: [{"title": "...", "links": {...}, "description": [...], "technologyStack": [...]}]
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Prevent duplicate profile types for the same user
  unique(user_id, profile_type)
);

-- GIN index for skill-based searches
create index idx_job_profiles_skills on public.job_profiles using gin (technical_skills);

-- Index for quick user lookups
create index idx_job_profiles_user_id on public.job_profiles(user_id);

-- -----------------------------------------------------------------------------
-- 9. SECURITY POLICIES (Row Level Security)
-- Ensures users can only see their own data.
-- -----------------------------------------------------------------------------

alter table public.user_settings enable row level security;
alter table public.master_resumes enable row level security;
alter table public.generated_resumes enable row level security;
alter table public.email_automations enable row level security;
alter table public.founder_outreaches enable row level security;
alter table public.resume_generations enable row level security;
alter table public.api_request_logs enable row level security;
alter table public.job_profiles enable row level security;

-- Create policy for user_settings
create policy "Users can own settings" on public.user_settings
  using (auth.uid() = user_id);

-- Loop for others (Simple 'Select/Insert/Update/Delete own data' logic)
create policy "Users manage own master resumes" on public.master_resumes
  using (auth.uid() = user_id);

create policy "Users manage own generated resumes" on public.generated_resumes
  using (auth.uid() = user_id);

create policy "Users manage own email automations" on public.email_automations
  using (auth.uid() = user_id);

create policy "Users manage own founder outreaches" on public.founder_outreaches
  using (auth.uid() = user_id);

create policy "Users manage own resume generations" on public.resume_generations
  using (auth.uid() = user_id);
  
create policy "Users manage own api logs" on public.api_request_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own job profiles" on public.job_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);