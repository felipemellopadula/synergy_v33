-- First, add admin value to subscription_type enum
ALTER TYPE subscription_type ADD VALUE IF NOT EXISTS 'admin';