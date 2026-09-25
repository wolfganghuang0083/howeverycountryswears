-- HECS page_hits — last 7 days, human vs bot share (HTML page views only). No IPs stored.
--
-- Sources (column page_hits.source, migration 0005):
--   'beacon' : browser JS beacon (POST /api/hit after page load; SPA route changes counted, deduped).
--              is_bot=false => human; is_bot=true => JS-running bot with a bot UA (e.g. HeadlessChrome).
--   'server' : non-search-engine bot UAs routed by vercel.json to /api/bot-page (always is_bot=true).
--   NULL     : rows from the pre-launch middleware experiment (all hecs-probe) — ignored below.
--
-- Definitions:  humans = source='beacon' AND NOT is_bot
--               bots   = source='server'  OR (source='beacon' AND is_bot)
--
-- NOT IN page_hits BY DESIGN: search-engine crawlers (Googlebot family incl. Google-InspectionTool,
-- Storebot-Google, AdsBot-Google, Mediapartners-Google; bingbot; DuckDuckBot; YandexBot; Baiduspider;
-- Applebot) are served from the CDN cache and never logged. Use Google Search Console > Settings >
-- Crawl stats (and Bing Webmaster Tools) for their volume.
--
-- BLIND SPOT: crawlers that disguise themselves with a normal browser UA AND do not run JavaScript
-- are caught by neither side (no bot UA => no server row; no JS => no beacon row).
--
-- Probe exclusion: our own test traffic carries 'hecs-probe' in the UA.

-- ===== 1) Totals (probes excluded) =====
WITH w AS (
  SELECT * FROM page_hits
  WHERE ts >= now() - interval '7 days'
    AND source IN ('beacon', 'server')
    AND COALESCE(user_agent, '') NOT ILIKE '%hecs-probe%'
)
SELECT
  COUNT(*)                                                        AS total_html_requests,
  COUNT(*) FILTER (WHERE source = 'beacon' AND NOT is_bot)        AS human_count,
  COUNT(*) FILTER (WHERE is_bot)                                  AS bot_count,
  COUNT(*) FILTER (WHERE source = 'server')                       AS bot_server_rows,
  COUNT(*) FILTER (WHERE source = 'beacon' AND is_bot)            AS bot_js_beacon_rows,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_bot) / NULLIF(COUNT(*), 0), 2) AS bot_share_pct
FROM w;

-- ===== 2) Top 10 bot_name (probes excluded) =====
SELECT bot_name, COUNT(*) AS hits,
       COUNT(*) FILTER (WHERE source = 'server') AS via_server,
       COUNT(*) FILTER (WHERE source = 'beacon') AS via_beacon
FROM page_hits
WHERE ts >= now() - interval '7 days'
  AND source IN ('beacon', 'server')
  AND is_bot
  AND COALESCE(user_agent, '') NOT ILIKE '%hecs-probe%'
GROUP BY bot_name
ORDER BY hits DESC
LIMIT 10;

-- ===== 3) Daily breakdown by Asia/Tokyo date (probes excluded) =====
SELECT (ts AT TIME ZONE 'Asia/Tokyo')::date                        AS day_jst,
       COUNT(*)                                                     AS total,
       COUNT(*) FILTER (WHERE source = 'beacon' AND NOT is_bot)     AS humans,
       COUNT(*) FILTER (WHERE is_bot)                               AS bots,
       ROUND(100.0 * COUNT(*) FILTER (WHERE is_bot) / NULLIF(COUNT(*), 0), 2) AS bot_share_pct
FROM page_hits
WHERE ts >= now() - interval '7 days'
  AND source IN ('beacon', 'server')
  AND COALESCE(user_agent, '') NOT ILIKE '%hecs-probe%'
GROUP BY 1
ORDER BY 1;

-- ===== 4) (Optional) same totals INCLUDING probes, for debugging =====
-- SELECT source, is_bot, COUNT(*) FROM page_hits WHERE ts >= now() - interval '7 days' GROUP BY 1,2 ORDER BY 1,2;
