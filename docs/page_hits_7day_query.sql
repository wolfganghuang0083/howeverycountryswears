-- HECS page_hits: last-7-day human vs bot share (HTML page requests only).
-- Table populated by /middleware.ts (Vercel Routing Middleware). No IPs stored.
-- Our own probes use a UA containing 'hecs-probe' (see variant B).

-- ===== A) All traffic, last 7 days =====
SELECT
  COUNT(*)                                              AS total_html_requests,
  COUNT(*) FILTER (WHERE is_bot)                        AS bot_count,
  COUNT(*) FILTER (WHERE NOT is_bot)                    AS human_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_bot) / NULLIF(COUNT(*), 0), 2) AS bot_share_pct
FROM page_hits
WHERE ts >= now() - interval '7 days';

-- Top 10 bots, last 7 days
SELECT bot_name, COUNT(*) AS hits,
       ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 2) AS pct_of_bot_hits
FROM page_hits
WHERE ts >= now() - interval '7 days' AND is_bot
GROUP BY bot_name
ORDER BY hits DESC
LIMIT 10;

-- ===== B) Excluding our own probes / test traffic =====
-- Excludes: UAs tagged 'hecs-probe', rows written before go-live on Preview testing
-- (Preview and Production share this DB, so also drop the known probe window if needed).
WITH clean AS (
  SELECT * FROM page_hits
  WHERE ts >= now() - interval '7 days'
    AND COALESCE(user_agent, '') NOT ILIKE '%hecs-probe%'
    AND path NOT LIKE '/__probe%'
)
SELECT
  COUNT(*)                                              AS total_html_requests,
  COUNT(*) FILTER (WHERE is_bot)                        AS bot_count,
  COUNT(*) FILTER (WHERE NOT is_bot)                    AS human_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_bot) / NULLIF(COUNT(*), 0), 2) AS bot_share_pct
FROM clean;

WITH clean AS (
  SELECT * FROM page_hits
  WHERE ts >= now() - interval '7 days'
    AND COALESCE(user_agent, '') NOT ILIKE '%hecs-probe%'
    AND path NOT LIKE '/__probe%'
)
SELECT bot_name, COUNT(*) AS hits
FROM clean
WHERE is_bot
GROUP BY bot_name
ORDER BY hits DESC
LIMIT 10;

-- Optional: daily breakdown (Asia/Tokyo days), probes excluded
SELECT (ts AT TIME ZONE 'Asia/Tokyo')::date AS day_jst,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE is_bot) AS bots,
       COUNT(*) FILTER (WHERE NOT is_bot) AS humans
FROM page_hits
WHERE ts >= now() - interval '7 days'
  AND COALESCE(user_agent, '') NOT ILIKE '%hecs-probe%'
GROUP BY 1 ORDER BY 1;
