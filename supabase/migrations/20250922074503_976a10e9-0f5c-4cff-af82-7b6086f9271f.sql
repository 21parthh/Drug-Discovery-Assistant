-- Update existing user analytics with correct values from reports
UPDATE user_analytics 
SET 
  reports_generated = (
    SELECT COUNT(*) 
    FROM reports 
    WHERE reports.user_id = user_analytics.user_id
  ),
  compounds_analyzed = (
    SELECT COALESCE(SUM(compounds_count), 0) 
    FROM reports 
    WHERE reports.user_id = user_analytics.user_id
  ),
  targets_discovered = (
    SELECT COALESCE(SUM(targets_count), 0) 
    FROM reports 
    WHERE reports.user_id = user_analytics.user_id
  ),
  updated_at = now()
WHERE user_id IN (
  SELECT DISTINCT user_id FROM reports
);