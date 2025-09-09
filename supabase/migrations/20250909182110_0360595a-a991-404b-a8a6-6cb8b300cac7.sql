-- Create function to force delete storage files (admin only)
CREATE OR REPLACE FUNCTION public.delete_storage_file(bucket_name text, file_path text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Delete from storage.objects table directly
  DELETE FROM storage.objects 
  WHERE bucket_id = bucket_name AND name = file_path;
  
  -- Return true if deletion was successful
  RETURN FOUND;
END;
$$;

-- Create function to force delete all files in a bucket
CREATE OR REPLACE FUNCTION public.delete_all_storage_files(bucket_name text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete all files from the specified bucket
  DELETE FROM storage.objects WHERE bucket_id = bucket_name;
  
  -- Get the number of deleted rows
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;