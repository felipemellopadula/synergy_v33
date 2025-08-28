-- Create storage bucket for video reference images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('video-refs', 'video-refs', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for video-refs bucket
CREATE POLICY "Users can view video references" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'video-refs');

CREATE POLICY "Users can upload video references" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'video-refs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their video references" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'video-refs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their video references" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'video-refs' AND auth.uid() IS NOT NULL);