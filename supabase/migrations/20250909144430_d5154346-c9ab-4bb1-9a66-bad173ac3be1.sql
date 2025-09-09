-- Fix the freed_space_mb column to accept decimal values
ALTER TABLE public.storage_cleanup_logs 
ALTER COLUMN freed_space_mb TYPE NUMERIC(10,2);