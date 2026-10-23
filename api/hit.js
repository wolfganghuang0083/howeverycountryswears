// POST /api/hit — legacy page-view beacon endpoint, now a no-op.
// Page views are counted by GA4 (page_view) only. This handler must NOT import or open
// any database connection: Neon bills compute by time awake, and a write on every page
// view kept the database from ever suspending. Kept (returning 204) so cached old clients
// that still send the beacon don't produce 404 noise.
export default function handler(req, res) {
  res.statusCode = 204;
  res.setHeader("Cache-Control", "no-store");
  res.end();
}
