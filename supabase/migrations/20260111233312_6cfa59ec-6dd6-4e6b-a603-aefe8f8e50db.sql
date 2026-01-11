-- Add motion_prompt column for video generation instructions
ALTER TABLE storyboard_scenes 
ADD COLUMN motion_prompt TEXT;