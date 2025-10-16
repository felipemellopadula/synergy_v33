-- Add has_seen_welcome_modal field to profiles table
ALTER TABLE public.profiles
ADD COLUMN has_seen_welcome_modal BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.has_seen_welcome_modal IS 'Tracks if user has seen the welcome modal on first dashboard access';